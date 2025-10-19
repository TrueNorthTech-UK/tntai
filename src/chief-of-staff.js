/**
 * True North Tech - Chief of Staff Agent
 * Role: Orchestrates all agents, facilitates decisions, manages workflows
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      if (path === '/workflow/start' && request.method === 'POST') {
        return await handleStartWorkflow(request, env, corsHeaders);
      }
      
      if (path.match(/^\/workflow\/(.+)\/status$/) && request.method === 'GET') {
        const workflowId = path.match(/^\/workflow\/(.+)\/status$/)[1];
        return await handleGetStatus(workflowId, env, corsHeaders);
      }
      
      if (path.match(/^\/workflow\/(.+)\/decision$/) && request.method === 'POST') {
        const workflowId = path.match(/^\/workflow\/(.+)\/decision$/)[1];
        return await handleDecision(workflowId, request, env, corsHeaders);
      }
      
      if (path.match(/^\/workflow\/(.+)\/outputs$/) && request.method === 'GET') {
        const workflowId = path.match(/^\/workflow\/(.+)\/outputs$/)[1];
        return await handleGetOutputs(workflowId, env, corsHeaders);
      }

      if (path === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'healthy', agent: 'chief-of-staff' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });

    } catch (error) {
      console.error('Chief of Staff Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

/**
 * Start a new workflow
 */
async function handleStartWorkflow(request, env, corsHeaders) {
  const { feature_request, priority = 5 } = await request.json();
  
  if (!feature_request) {
    return new Response(JSON.stringify({ error: 'feature_request is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();

  // Analyze the request using Claude
  const analysis = await analyzeFeatureRequest(feature_request, env);

  // Create workflow record
  await env.DB.prepare(`
    INSERT INTO workflows (workflow_id, feature_request, status, current_step, context, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    workflowId,
    feature_request,
    'in_progress',
    'research',
    JSON.stringify(analysis),
    timestamp,
    timestamp
  ).run();

  // Create tasks for the 5 MVP agents
  const tasks = analysis.tasks;
  
  for (const task of tasks) {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO task_queue (task_id, workflow_id, assigned_to, task_type, priority, input, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      taskId,
      workflowId,
      task.agent,
      task.type,
      task.priority || priority,
      JSON.stringify(task.input),
      'pending',
      timestamp
    ).run();

    // Send message to queue (trigger agent)
    await env.AGENT_QUEUE.send({
      taskId,
      workflowId,
      agent: task.agent,
      type: task.type,
      input: task.input
    });
  }

  // Log audit
  await env.DB.prepare(`
    INSERT INTO audit_log (actor, action, resource_type, resource_id, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    'chief-of-staff',
    'workflow_started',
    'workflow',
    workflowId,
    JSON.stringify({ feature_request, estimated_time: analysis.estimated_time }),
    timestamp
  ).run();

  return new Response(JSON.stringify({
    workflow_id: workflowId,
    status: 'in_progress',
    estimated_time: analysis.estimated_time,
    tasks_created: tasks.length,
    message: 'Workflow started successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Get workflow status
 */
async function handleGetStatus(workflowId, env, corsHeaders) {
  const workflow = await env.DB.prepare(
    'SELECT * FROM workflows WHERE workflow_id = ?'
  ).bind(workflowId).first();

  if (!workflow) {
    return new Response(JSON.stringify({ error: 'Workflow not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get pending tasks
  const tasks = await env.DB.prepare(
    'SELECT * FROM task_queue WHERE workflow_id = ? ORDER BY priority DESC, created_at ASC'
  ).bind(workflowId).all();

  // Get pending decisions
  const decisions = await env.DB.prepare(
    'SELECT * FROM decisions WHERE workflow_id = ? AND decision IS NULL ORDER BY timestamp DESC'
  ).bind(workflowId).all();

  // Calculate progress
  const totalTasks = tasks.results.length;
  const completedTasks = tasks.results.filter(t => t.status === 'complete').length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return new Response(JSON.stringify({
    workflow_id: workflowId,
    status: workflow.status,
    current_step: workflow.current_step,
    progress: Math.round(progress),
    tasks: {
      total: totalTasks,
      completed: completedTasks,
      pending: tasks.results.filter(t => t.status === 'pending').length,
      in_progress: tasks.results.filter(t => t.status === 'in_progress').length,
      failed: tasks.results.filter(t => t.status === 'failed').length
    },
    pending_decisions: decisions.results.map(d => ({
      decision_id: d.decision_id,
      title: d.title,
      impact_level: d.impact_level
    })),
    created_at: workflow.created_at,
    updated_at: workflow.updated_at
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Handle user decision
 */
async function handleDecision(workflowId, request, env, corsHeaders) {
  const { decision_id, choice, reasoning } = await request.json();

  if (!decision_id || !choice) {
    return new Response(JSON.stringify({ error: 'decision_id and choice are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const timestamp = Date.now();

  // Update decision
  await env.DB.prepare(`
    UPDATE decisions 
    SET decision = ?, decided_by = ?, reasoning = ?, timestamp = ?
    WHERE decision_id = ? AND workflow_id = ?
  `).bind(choice, 'human', reasoning || null, timestamp, decision_id, workflowId).run();

  // Propagate decision to affected agents
  await propagateDecision(workflowId, decision_id, choice, env);

  // Log audit
  await env.DB.prepare(`
    INSERT INTO audit_log (actor, action, resource_type, resource_id, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    'human',
    'decision_made',
    'decision',
    decision_id,
    JSON.stringify({ choice, reasoning }),
    timestamp
  ).run();

  return new Response(JSON.stringify({
    status: 'acknowledged',
    decision_id,
    choice,
    message: 'Decision executed successfully'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Get workflow outputs
 */
async function handleGetOutputs(workflowId, env, corsHeaders) {
  const outputs = await env.DB.prepare(
    'SELECT * FROM agent_outputs WHERE task_id IN (SELECT task_id FROM task_queue WHERE workflow_id = ?) ORDER BY timestamp DESC'
  ).bind(workflowId).all();

  const summary = await generateWorkflowSummary(workflowId, outputs.results, env);

  return new Response(JSON.stringify({
    workflow_id: workflowId,
    outputs: outputs.results.map(o => ({
      agent: o.agent_name,
      task_type: o.task_type,
      timestamp: o.timestamp,
      confidence: o.confidence_score,
      status: o.status
    })),
    summary
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

/**
 * Analyze feature request using Claude
 */
async function analyzeFeatureRequest(feature_request, env) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `You are the Chief of Staff for True North Tech AI Agent System.

Analyze this feature request and break it down into tasks for our 5 MVP agents:
1. Market Research Agent
2. UI/UX Designer Agent
3. Frontend Engineer Agent
4. QA Engineer Agent

Feature Request: ${feature_request}

Respond ONLY with valid JSON in this format:
{
  "estimated_time": "time estimate in minutes",
  "tasks": [
    {
      "agent": "agent name",
      "type": "task type",
      "priority": 1-10,
      "input": {
        "description": "what the agent should do"
      }
    }
  ]
}`
      }]
    })
  });

  const data = await response.json();
  const content = data.content[0].text;
  
  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // Fallback if Claude doesn't return proper JSON
  return {
    estimated_time: '120 minutes',
    tasks: [
      { agent: 'market-research', type: 'research', priority: 10, input: { description: feature_request } },
      { agent: 'ui-designer', type: 'design', priority: 8, input: { description: feature_request } },
      { agent: 'frontend-engineer', type: 'implement', priority: 6, input: { description: feature_request } },
      { agent: 'qa-engineer', type: 'test', priority: 4, input: { description: feature_request } }
    ]
  };
}

/**
 * Propagate decision to affected agents
 */
async function propagateDecision(workflowId, decisionId, choice, env) {
  const timestamp = Date.now();
  
  // Send message to all agents in the workflow
  const tasks = await env.DB.prepare(
    'SELECT DISTINCT assigned_to FROM task_queue WHERE workflow_id = ?'
  ).bind(workflowId).all();

  for (const task of tasks.results) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await env.DB.prepare(`
      INSERT INTO agent_messages (message_id, from_agent, to_agent, message_type, message, workflow_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      messageId,
      'chief-of-staff',
      task.assigned_to,
      'status',
      JSON.stringify({ decision_id: decisionId, choice, type: 'decision_update' }),
      workflowId,
      timestamp
    ).run();
  }
}

/**
 * Generate workflow summary
 */
async function generateWorkflowSummary(workflowId, outputs, env) {
  // Use Claude to generate summary
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Summarize these agent outputs for workflow ${workflowId}:

${outputs.map(o => `${o.agent_name}: ${o.output.substring(0, 200)}...`).join('\n\n')}

Provide a brief executive summary of what was accomplished.`
      }]
    })
  });

  const data = await response.json();
  return data.content[0].text;
}