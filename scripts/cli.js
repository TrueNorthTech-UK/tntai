#!/usr/bin/env node

/**
 * True North Tech CLI
 * Easy command-line interface for interacting with the AI agent system
 */

const https = require('https');
const readline = require('readline');

const BASE_URL = process.env.TRUENORTH_URL || 'YOUR_WORKER_URL'; // Replace after deployment

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function startWorkflow() {
  log('\n╔════════════════════════════════════════╗', colors.blue);
  log('║      Start New Workflow                ║', colors.blue);
  log('╚════════════════════════════════════════╝', colors.blue);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nDescribe the feature you want to build:\n> ', async (featureRequest) => {
      rl.close();

      if (!featureRequest.trim()) {
        log('❌ Feature request cannot be empty', colors.red);
        resolve();
        return;
      }

      log('\n🚀 Starting workflow...', colors.cyan);
      
      try {
        const result = await makeRequest('/workflow/start', 'POST', {
          feature_request: featureRequest,
        });

        log('\n✅ Workflow started successfully!', colors.green);
        log(`\nWorkflow ID: ${result.workflow_id}`, colors.bright);
        log(`Status: ${result.status}`, colors.dim);
        log(`Estimated time: ${result.estimated_time}`, colors.dim);
        log(`Tasks created: ${result.tasks_created}`, colors.dim);
        
        log(`\n💡 Track progress with: truenorth status ${result.workflow_id}`, colors.yellow);
      } catch (error) {
        log(`\n❌ Error: ${error.message}`, colors.red);
      }

      resolve();
    });
  });
}

async function getStatus(workflowId) {
  if (!workflowId) {
    log('❌ Workflow ID required', colors.red);
    log('Usage: truenorth status <workflow_id>', colors.dim);
    return;
  }

  log('\n📊 Fetching workflow status...', colors.cyan);
  
  try {
    const result = await makeRequest(`/workflow/${workflowId}/status`);

    log('\n╔════════════════════════════════════════╗', colors.blue);
    log('║      Workflow Status                   ║', colors.blue);
    log('╚════════════════════════════════════════╝', colors.blue);
    
    log(`\nWorkflow ID: ${result.workflow_id}`, colors.bright);
    log(`Status: ${result.status}`, result.status === 'complete' ? colors.green : colors.yellow);
    log(`Current Step: ${result.current_step}`, colors.dim);
    log(`Progress: ${result.progress}%`, colors.cyan);
    
    log('\n📝 Tasks:', colors.bright);
    log(`  Total: ${result.tasks.total}`, colors.dim);
    log(`  ✅ Completed: ${result.tasks.completed}`, colors.green);
    log(`  ⏳ In Progress: ${result.tasks.in_progress}`, colors.yellow);
    log(`  📌 Pending: ${result.tasks.pending}`, colors.dim);
    if (result.tasks.failed > 0) {
      log(`  ❌ Failed: ${result.tasks.failed}`, colors.red);
    }

    if (result.pending_decisions && result.pending_decisions.length > 0) {
      log('\n⚠️  Pending Decisions:', colors.yellow);
      result.pending_decisions.forEach((decision, i) => {
        log(`  ${i + 1}. ${decision.title} (${decision.impact_level} impact)`, colors.bright);
        log(`     Decision ID: ${decision.decision_id}`, colors.dim);
      });
      log(`\n💡 Make decision with: truenorth decide ${workflowId} <decision_id>`, colors.cyan);
    }

    if (result.status === 'complete') {
      log(`\n🎉 Workflow complete! View outputs with: truenorth outputs ${workflowId}`, colors.green);
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
  }
}

async function getOutputs(workflowId) {
  if (!workflowId) {
    log('❌ Workflow ID required', colors.red);
    log('Usage: truenorth outputs <workflow_id>', colors.dim);
    return;
  }

  log('\n📄 Fetching workflow outputs...', colors.cyan);
  
  try {
    const result = await makeRequest(`/workflow/${workflowId}/outputs`);

    log('\n╔════════════════════════════════════════╗', colors.blue);
    log('║      Workflow Outputs                  ║', colors.blue);
    log('╚════════════════════════════════════════╝', colors.blue);
    
    log(`\nWorkflow ID: ${result.workflow_id}`, colors.bright);
    
    log('\n📋 Summary:', colors.bright);
    log(result.summary, colors.dim);
    
    log('\n🤖 Agent Outputs:', colors.bright);
    result.outputs.forEach((output, i) => {
      const statusIcon = output.status === 'complete' ? '✅' : '❌';
      log(`\n${i + 1}. ${statusIcon} ${output.agent}`, colors.cyan);
      log(`   Task: ${output.task_type}`, colors.dim);
      log(`   Confidence: ${Math.round(output.confidence * 100)}%`, colors.dim);
      log(`   Timestamp: ${new Date(output.timestamp).toLocaleString()}`, colors.dim);
    });

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
  }
}

async function makeDecision(workflowId, decisionId) {
  if (!workflowId || !decisionId) {
    log('❌ Workflow ID and Decision ID required', colors.red);
    log('Usage: truenorth decide <workflow_id> <decision_id>', colors.dim);
    return;
  }

  log('\n⚠️  Making decision...', colors.yellow);
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\nEnter your choice (option_a, option_b, etc.):\n> ', (choice) => {
      rl.question('\nReasoning (optional):\n> ', async (reasoning) => {
        rl.close();

        if (!choice.trim()) {
          log('❌ Choice cannot be empty', colors.red);
          resolve();
          return;
        }

        try {
          const result = await makeRequest(`/workflow/${workflowId}/decision`, 'POST', {
            decision_id: decisionId,
            choice: choice.trim(),
            reasoning: reasoning.trim() || undefined,
          });

          log('\n✅ Decision recorded!', colors.green);
          log(`\nDecision ID: ${result.decision_id}`, colors.bright);
          log(`Choice: ${result.choice}`, colors.dim);
          log(`\n💡 Check updated status with: truenorth status ${workflowId}`, colors.cyan);

        } catch (error) {
          log(`\n❌ Error: ${error.message}`, colors.red);
        }

        resolve();
      });
    });
  });
}

function showHelp() {
  log('\n╔════════════════════════════════════════╗', colors.blue);
  log('║   True North Tech CLI - Help          ║', colors.blue);
  log('╚════════════════════════════════════════╝', colors.blue);
  
  log('\nUsage: truenorth <command> [options]', colors.bright);
  
  log('\nCommands:', colors.cyan);
  log('  start              Start a new workflow', colors.dim);
  log('  status <id>        Get workflow status', colors.dim);
  log('  outputs <id>       Get workflow outputs', colors.dim);
  log('  decide <id> <dec>  Make a decision', colors.dim);
  log('  help               Show this help message', colors.dim);
  
  log('\nExamples:', colors.cyan);
  log('  truenorth start', colors.dim);
  log('  truenorth status wf_1729363200_abc123', colors.dim);
  log('  truenorth outputs wf_1729363200_abc123', colors.dim);
  log('  truenorth decide wf_1729363200_abc123 dec_1729363500_xyz789', colors.dim);
  
  log('\nEnvironment Variables:', colors.cyan);
  log('  TRUENORTH_URL      Base URL of your Chief of Staff worker', colors.dim);
  
  log('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (BASE_URL === 'YOUR_WORKER_URL') {
    log('❌ Error: TRUENORTH_URL not configured', colors.red);
    log('\nSet your worker URL:', colors.yellow);
    log('  export TRUENORTH_URL="https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev"', colors.dim);
    log('\nOr edit truenorth-cli.js and replace YOUR_WORKER_URL', colors.dim);
    return;
  }

  switch (command) {
    case 'start':
      await startWorkflow();
      break;
    
    case 'status':
      await getStatus(args[1]);
      break;
    
    case 'outputs':
      await getOutputs(args[1]);
      break;
    
    case 'decide':
      await makeDecision(args[1], args[2]);
      break;
    
    case 'help':
    case '--help':
    case '-h':
    default:
      showHelp();
      break;
  }
}

main().catch((error) => {
  log(`\n❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});