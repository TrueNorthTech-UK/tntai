/**
 * True North Tech - Base Agent Template
 * All specialized agents extend this base functionality
 */

export class BaseAgent {
  constructor(config) {
    this.agentName = config.agentName;
    this.systemPrompt = config.systemPrompt;
    this.capabilities = config.capabilities || [];
  }

  /**
   * Main entry point for Cloudflare Worker
   */
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (request.method === 'POST') {
        const taskRequest = await request.json();
        return await this.handleTask(taskRequest, env, corsHeaders);
      }

      if (request.method === 'GET' && request.url.endsWith('/health')) {
        return new Response(JSON.stringify({
          status: 'healthy',
          agent: this.agentName,
          capabilities: this.capabilities
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Method not allowed', { status: 405, headers: corsHeaders });

    } catch (error) {
      console.error(`${this.agentName} Error:`, error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Handle incoming task
   */
  async handleTask(taskRequest, env, corsHeaders) {
    const { task_id, task_type, input, context } = taskRequest;

    if (!task_id || !task_type) {
      return new Response(JSON.stringify({ error: 'task_id and task_type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const timestamp = Date.now();

    try {
      // Update task status to in_progress
      await env.DB.prepare(
        'UPDATE task_queue SET status = ?, started_at = ? WHERE task_id = ?'
      ).bind('in_progress', timestamp, task_id).run();

      // Check agent memory for relevant context
      const memory = await this.loadMemory(env, context);

      // Execute the task using Claude
      const result = await this.executeTask(task_type, input, context, memory, env);

      // Save output
      await env.DB.prepare(`
        INSERT INTO agent_outputs (agent_name, task_id, task_type, output, confidence_score, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        this.agentName,
        task_id,
        task_type,
        JSON.stringify(result.output),
        result.confidence || 0.8,
        timestamp,
        'complete'
      ).run();

      // Update task status to complete
      await env.DB.prepare(
        'UPDATE task_queue SET status = ?, completed_at = ? WHERE task_id = ?'
      ).bind('complete', timestamp, task_id).run();

      // Save to memory if needed
      if (result.remember) {
        await this.saveToMemory(env, result.remember);
      }

      // Check if we need to escalate decision
      if (result.needs_input) {
        await this.escalateDecision(task_id, result.questions, context, env);
      }

      // Log audit
      await env.DB.prepare(`
        INSERT INTO audit_log (actor, action, resource_type, resource_id, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        this.agentName,
        'task_completed',
        'task',
        task_id,
        JSON.stringify({ task_type, confidence: result.confidence }),
        timestamp
      ).run();

      return new Response(JSON.stringify({
        agent_name: this.agentName,
        task_id,
        status: result.needs_input ? 'needs_input' : 'complete',
        confidence: result.confidence,
        output: result.output,
        next_steps: result.next_steps || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error(`Task execution error:`, error);

      // Update task status to failed
      await env.DB.prepare(
        'UPDATE task_queue SET status = ?, retry_count = retry_count + 1 WHERE task_id = ?'
      ).bind('failed', task_id).run();

      // Check if we should retry
      const task = await env.DB.prepare(
        'SELECT retry_count, max_retries FROM task_queue WHERE task_id = ?'
      ).bind(task_id).first();

      if (task && task.retry_count < task.max_retries) {
        // Retry the task
        await env.AGENT_QUEUE.send(taskRequest);
      }

      return new Response(JSON.stringify({
        agent_name: this.agentName,
        task_id,
        status: 'failed',
        error: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }

  /**
   * Execute task using Claude (override in subclass)
   */
  async executeTask(taskType, input, context, memory, env) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: this.buildSystemPrompt(context, memory),
        messages: [{
          role: 'user',
          content: this.buildTaskPrompt(taskType, input, context)
        }]
      })
    });

    const data = await response.json();
    const content = data.content[0].text;

    // Try to parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback to plain text response
    return {
      output: content,
      confidence: 0.7,
      next_steps: []
    };
  }

  /**
   * Build system prompt with context
   */
  buildSystemPrompt(context, memory) {
    let prompt = this.systemPrompt;

    if (context && context.workflow_id) {
      prompt += `\n\nYou are working on workflow ${context.workflow_id}.`;
    }

    if (memory && memory.length > 0) {
      prompt += `\n\nRelevant context from memory:\n${memory.map(m => `- ${m.key}: ${m.value}`).join('\n')}`;
    }

    if (context && context.previous_outputs) {
      prompt += `\n\nPrevious agent outputs:\n${Object.entries(context.previous_outputs || {}).map(([agent, output]) => `${agent}: ${JSON.stringify(output).substring(0, 200)}...`).join('\n')}`;
    }

    prompt += `\n\nIMPORTANT: Respond ONLY with valid JSON in this format:
{
  "output": "your main output/result",
  "confidence": 0.0-1.0,
  "next_steps": ["step 1", "step 2"],
  "needs_input": false,
  "questions": [],
  "remember": {}
}`;

    return prompt;
  }

  /**
   * Build task-specific prompt (override in subclass)
   */
  buildTaskPrompt(taskType, input, context) {
    return `Task Type: ${taskType}\n\nInput: ${JSON.stringify(input, null, 2)}`;
  }

  /**
   * Load relevant memory
   */
  async loadMemory(env, context) {
    const memory = await env.DB.prepare(
      'SELECT * FROM agent_memory WHERE agent_name = ? AND (expires_at IS NULL OR expires_at > ?) ORDER BY updated_at DESC LIMIT 10'
    ).bind(this.agentName, Date.now()).all();

    return memory.results || [];
  }

  /**
   * Save to memory
   */
  async saveToMemory(env, data) {
    const timestamp = Date.now();
    
    for (const [key, value] of Object.entries(data)) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO agent_memory (agent_name, memory_type, key, value, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        this.agentName,
        'decision',
        key,
        JSON.stringify(value),
        timestamp
      ).run();
    }
  }

  /**
   * Escalate decision to Chief of Staff / Human
   */
  async escalateDecision(taskId, questions, context, env) {
    const decisionId = `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = Date.now();

    await env.DB.prepare(`
      INSERT INTO decisions (decision_id, workflow_id, title, description, options, recommendation, decided_by, timestamp, impact_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      decisionId,
      context?.workflow_id || null,
      questions[0]?.title || 'Decision Required',
      questions[0]?.description || 'Input needed from human',
      JSON.stringify(questions[0]?.options || []),
      JSON.stringify(questions[0]?.recommendation || null),
      'pending',
      timestamp,
      questions[0]?.impact_level || 'medium'
    ).run();

    // Notify Chief of Staff
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO agent_messages (message_id, from_agent, to_agent, message_type, message, workflow_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      messageId,
      this.agentName,
      'chief-of-staff',
      'escalation',
      JSON.stringify({ decision_id: decisionId, task_id: taskId }),
      context?.workflow_id || null,
      timestamp
    ).run();
  }
}

/**
 * Create agent worker from configuration
 */
export function createAgent(config) {
  const agent = new BaseAgent(config);
  
  return {
    async fetch(request, env) {
      return agent.fetch(request, env);
    }
  };
}