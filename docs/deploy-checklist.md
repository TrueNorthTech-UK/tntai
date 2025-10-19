# True North Tech - Deployment Checklist

**Quick reference guide to complete your deployment in 15 minutes**

## ✅ Infrastructure Created (Already Done!)

- ✅ D1 Database: `truenorth-agents-db` (8a43cafc-cd91-45af-8367-bfd172e577dc)
- ✅ KV Memory: `truenorth-agent-memory` (b08501f35d24415b94e3d3771e89c80b)
- ✅ KV Decisions: `truenorth-agent-decisions` (5eee9ca2758c4dca9dd39a45270a3498)
- ✅ KV Context: `truenorth-agent-context` (462cfcda72214737b00c63cef829897c)
- ✅ Wrangler config updated with real IDs

## 📥 Step 1: Save All Files (5 min)

Copy all the artifacts from Claude to your local machine:

```bash
# Create project structure
mkdir -p tntai/{src,database,config,scripts,docs}
cd tntai

# Save each file:
# - src/chief-of-staff.js
# - src/agent-base-template.js
# - src/market-research-agent.js
# - src/ui-designer-agent.js
# - src/frontend-engineer-agent.js
# - src/qa-engineer-agent.js
# - database/truenorth-schema.sql
# - config/truenorth-wrangler.toml
# - scripts/deploy-truenorth.sh
# - scripts/truenorth-cli.js
# - package.json
# - .env.example
# - .gitignore
# - docs/README.md (from TRUENORTH-README.md)
# - docs/API-DOCUMENTATION.md
# - docs/PROJECT-STRUCTURE.md
# - docs/QUICKSTART-TUTORIAL.md
# - DEPLOYMENT-STATUS.md
```

## 🗄️ Step 2: Initialize Database (2 min)

```bash
# Apply schema to create tables
wrangler d1 execute truenorth-agents-db --file=database/truenorth-schema.sql

# Verify tables were created
wrangler d1 execute truenorth-agents-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected output**: 8 tables (agent_outputs, decisions, workflows, agent_messages, agent_memory, task_queue, system_metrics, audit_log)

## 📬 Step 3: Create Message Queue (1 min)

```bash
wrangler queues create truenorth-agent-queue
```

## 🔑 Step 4: Set Up Secrets (3 min)

```bash
# Set Anthropic API key for Chief of Staff
echo "YOUR_API_KEY" | wrangler secret put ANTHROPIC_API_KEY --name truenorth-chief-of-staff

# Set API key for each agent
echo "YOUR_API_KEY" | wrangler secret put ANTHROPIC_API_KEY --name truenorth-market-research
echo "YOUR_API_KEY" | wrangler secret put ANTHROPIC_API_KEY --name truenorth-ui-designer
echo "YOUR_API_KEY" | wrangler secret put ANTHROPIC_API_KEY --name truenorth-frontend-engineer
echo "YOUR_API_KEY" | wrangler secret put ANTHROPIC_API_KEY --name truenorth-qa-engineer

# Optional: GitHub token
echo "YOUR_GITHUB_TOKEN" | wrangler secret put GITHUB_TOKEN --name truenorth-chief-of-staff
```

**Get your Anthropic API key**: https://console.anthropic.com/

## 🚀 Step 5: Deploy Workers (3 min)

```bash
# Deploy Chief of Staff
cd src
wrangler deploy chief-of-staff.js \
  --name truenorth-chief-of-staff \
  --config ../config/truenorth-wrangler.toml

# Deploy agents
wrangler deploy market-research-agent.js --name truenorth-market-research
wrangler deploy ui-designer-agent.js --name truenorth-ui-designer
wrangler deploy frontend-engineer-agent.js --name truenorth-frontend-engineer
wrangler deploy qa-engineer-agent.js --name truenorth-qa-engineer
```

**Save your worker URL** from the output:
```
Published truenorth-chief-of-staff
  https://truenorth-chief-of-staff.XXXXX.workers.dev
```

## ✅ Step 6: Verify Deployment (1 min)

```bash
# Test health endpoint
curl https://truenorth-chief-of-staff.XXXXX.workers.dev/health

# Expected: {"status":"healthy","agent":"chief-of-staff"}

# Test each agent
curl https://truenorth-market-research.XXXXX.workers.dev/health
curl https://truenorth-ui-designer.XXXXX.workers.dev/health
curl https://truenorth-frontend-engineer.XXXXX.workers.dev/health
curl https://truenorth-qa-engineer.XXXXX.workers.dev/health
```

## 🎯 Step 7: First Test Workflow (30 sec)

```bash
# Start a simple workflow
curl -X POST https://truenorth-chief-of-staff.XXXXX.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{"feature_request": "Create a simple button component"}'

# Save the workflow_id from response
# Example: "workflow_id": "wf_1729363200_abc123"

# Check status
curl https://truenorth-chief-of-staff.XXXXX.workers.dev/workflow/wf_1729363200_abc123/status
```

## 🎉 Complete! What's Next?

### Try More Features

```bash
# Todo list
curl -X POST https://truenorth-chief-of-staff.XXXXX.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{"feature_request": "Create a todo list with add, delete, and toggle complete"}'

# Dark mode toggle
curl -X POST https://truenorth-chief-of-staff.XXXXX.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{"feature_request": "Add dark mode toggle that persists user preference"}'
```

### Install CLI (Optional)

```bash
cd ../scripts
chmod +x truenorth-cli.js
npm link

# Set your worker URL
export TRUENORTH_URL="https://truenorth-chief-of-staff.XXXXX.workers.dev"

# Use CLI
truenorth start
truenorth status wf_1729363200_abc123
truenorth outputs wf_1729363200_abc123
```

### Monitor Your System

```bash
# Watch logs
wrangler tail truenorth-chief-of-staff

# Check database
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM workflows ORDER BY created_at DESC LIMIT 5"

# View analytics
wrangler analytics truenorth-chief-of-staff
```

## 🐛 Troubleshooting

### "Worker not found"
```bash
wrangler deployments list --name truenorth-chief-of-staff
```

### "Unauthorized" errors
```bash
# Reset API key
wrangler secret put ANTHROPIC_API_KEY --name truenorth-chief-of-staff
```

### Workflow stuck
```bash
# Check logs
wrangler tail truenorth-chief-of-staff --format=pretty
```

### Database errors
```bash
# Verify tables exist
wrangler d1 execute truenorth-agents-db \
  --command="SELECT COUNT(*) FROM sqlite_master WHERE type='table'"
```

## 📊 Success Metrics

After 1 hour of use, you should see:
- ✅ At least 1 complete workflow
- ✅ 4+ agent outputs in database
- ✅ 90%+ autonomous decision rate
- ✅ Working React components generated
- ✅ Tests auto-generated and passing

## 💰 Cost Tracking

```bash
# Weekly check
wrangler analytics truenorth-chief-of-staff --date=last-week

# Monthly Anthropic usage
# Visit: https://console.anthropic.com/settings/usage
```

**Expected**: $2-5 for first 10 workflows

## 🆘 Need Help?

1. Check logs: `wrangler tail truenorth-chief-of-staff`
2. Query database: `wrangler d1 execute truenorth-agents-db --command="..."`
3. Review: `docs/README.md` for full documentation

---

**Total Time**: ~15 minutes  
**Difficulty**: Easy (just follow commands)  
**Result**: Fully operational AI agent system!