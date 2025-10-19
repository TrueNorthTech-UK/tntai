# True North Tech - Quick Start Tutorial

This guide will walk you through deploying and using the True North Tech AI Agent System for the first time.

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Cloudflare account (free tier is fine)
- [ ] Anthropic API key ([Get one here](https://console.anthropic.com/))
- [ ] GitHub account (optional, for code commits)
- [ ] 30 minutes of time

## 🚀 Part 1: Setup (10 minutes)

### Step 1: Install Wrangler CLI

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version
```

### Step 2: Login to Cloudflare

```bash
# This will open a browser for authentication
wrangler login

# Verify you're logged in
wrangler whoami
```

### Step 3: Clone and Configure

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tntai.git
cd tntai

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

In `.env`, add:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_ACTUAL_KEY
CLOUDFLARE_ACCOUNT_ID=3084a71c3a01c15a95432e43c1abb895
```

### Step 4: Deploy

```bash
# Make deployment script executable
chmod +x scripts/deploy-truenorth.sh

# Run deployment
./scripts/deploy-truenorth.sh
```

**What happens during deployment:**
1. ✅ Creates D1 database: `truenorth-agents-db`
2. ✅ Creates 3 KV namespaces for memory/decisions/context
3. ✅ Creates message queue: `truenorth-agent-queue`
4. ✅ Deploys 5 AI agent workers
5. ✅ Configures secrets (API keys)

**Expected output:**
```
╔════════════════════════════════════════════════════╗
║          🎉 DEPLOYMENT SUCCESSFUL! 🎉             ║
╚════════════════════════════════════════════════════╝

Your True North Tech AI Agent System is now live!
```

### Step 5: Note Your Worker URL

After deployment, you'll see output like:
```
Published truenorth-chief-of-staff
  https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev
```

**Save this URL!** You'll need it for the next steps.

Update your `.env`:
```bash
TRUENORTH_URL=https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev
```

## 🎯 Part 2: First Workflow (5 minutes)

Let's create a simple todo list component to test the system.

### Using the CLI

```bash
# Install CLI tool globally
npm link

# Start a workflow
truenorth start
```

When prompted, enter:
```
Create a todo list component with add, delete, and toggle complete functionality
```

### Using curl

```bash
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{
    "feature_request": "Create a todo list component with add, delete, and toggle complete functionality"
  }'
```

**Expected response:**
```json
{
  "workflow_id": "wf_1729363200_abc123",
  "status": "in_progress",
  "estimated_time": "45 minutes",
  "tasks_created": 4,
  "message": "Workflow started successfully"
}
```

**Save the `workflow_id`** - you'll use it to check progress!

## 📊 Part 3: Monitor Progress (10 minutes)

### Check Status

```bash
# Using CLI
truenorth status wf_1729363200_abc123

# Or using curl
curl https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/wf_1729363200_abc123/status
```

**What you'll see:**
```json
{
  "workflow_id": "wf_1729363200_abc123",
  "status": "in_progress",
  "current_step": "development",
  "progress": 60,
  "tasks": {
    "total": 4,
    "completed": 2,
    "pending": 1,
    "in_progress": 1
  }
}
```

### Understanding the Workflow Steps

1. **Research (5-10 min)** - Market Research Agent analyzes similar features
2. **Design (10-15 min)** - UI Designer Agent creates component spec
3. **Development (15-20 min)** - Frontend Engineer Agent writes code
4. **Testing (5-10 min)** - QA Engineer Agent generates tests

### Watch Live Logs (Optional)

```bash
# Watch Chief of Staff logs in real-time
wrangler tail truenorth-chief-of-staff

# Or watch specific agent
wrangler tail truenorth-market-research
```

## ✅ Part 4: Review Results (5 minutes)

Once status shows `"status": "complete"`:

```bash
# Get workflow outputs
truenorth outputs wf_1729363200_abc123
```

**You'll receive:**
```json
{
  "workflow_id": "wf_1729363200_abc123",
  "outputs": [
    {
      "agent": "market-research",
      "task_type": "research",
      "confidence": 0.85,
      "status": "complete"
    },
    {
      "agent": "ui-designer",
      "task_type": "design",
      "confidence": 0.92,
      "status": "complete"
    },
    {
      "agent": "frontend-engineer",
      "task_type": "implement",
      "confidence": 0.88,
      "status": "complete"
    },
    {
      "agent": "qa-engineer",
      "task_type": "test",
      "confidence": 0.95,
      "status": "complete"
    }
  ],
  "summary": "Market research found 5 competitor implementations. Design created responsive component. Code generated with 95% test coverage."
}
```

### Query the Database

```bash
# View the actual outputs in database
wrangler d1 execute truenorth-agents-db \
  --command="SELECT agent_name, task_type, output FROM agent_outputs WHERE task_id IN (SELECT task_id FROM task_queue WHERE workflow_id='wf_1729363200_abc123')"
```

## 🎓 Part 5: Understanding Decisions

Sometimes agents need your input. Here's how it works:

### Scenario: Design Conflict

```json
{
  "pending_decisions": [
    {
      "decision_id": "dec_1729363500_xyz789",
      "title": "Button Style for Todo Actions",
      "impact_level": "low"
    }
  ]
}
```

### Get Decision Details

Query the database:
```bash
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM decisions WHERE decision_id='dec_1729363500_xyz789'"
```

### Make Your Decision

```bash
# Using CLI
truenorth decide wf_1729363200_abc123 dec_1729363500_xyz789
# Then follow prompts

# Or using curl
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/wf_1729363200_abc123/decision \
  -H 'Content-Type: application/json' \
  -d '{
    "decision_id": "dec_1729363500_xyz789",
    "choice": "option_a",
    "reasoning": "Matches existing design system"
  }'
```

## 📚 Next Steps

### Try More Complex Features

```bash
# Dark mode toggle
truenorth start
> "Add a dark mode toggle that respects system preference and persists user choice"

# User profile card
truenorth start
> "Create a user profile card with avatar, name, bio, and social links"

# Form validation
truenorth start
> "Build a signup form with email, password, and real-time validation"
```

### Explore the Database

```bash
# View all workflows
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM workflows ORDER BY created_at DESC LIMIT 10"

# View agent memory
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM agent_memory"

# View decision history
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM decisions ORDER BY timestamp DESC"
```

### Monitor Costs

```bash
# View Cloudflare usage
wrangler analytics truenorth-chief-of-staff

# Check Anthropic API usage
# Visit: https://console.anthropic.com/
```

## 🐛 Troubleshooting

### Problem: "Worker not found"

**Solution:** Verify deployment succeeded
```bash
wrangler deployments list --name truenorth-chief-of-staff
```

### Problem: "Unauthorized" or "Invalid API key"

**Solution:** Reset your Anthropic API key
```bash
wrangler secret put ANTHROPIC_API_KEY
# Then paste your key
```

### Problem: Workflow stuck at 0%

**Solution:** Check agent logs
```bash
wrangler tail truenorth-chief-of-staff --format=pretty
```

### Problem: Database errors

**Solution:** Verify D1 database exists
```bash
wrangler d1 list | grep truenorth
wrangler d1 execute truenorth-agents-db --command="SELECT 1"
```

## 💡 Tips & Best Practices

### 1. Be Specific in Feature Requests

❌ Bad: "Make a form"
✅ Good: "Create a contact form with name, email, and message fields. Include validation and a success message."

### 2. Monitor Regularly

```bash
# Add to crontab for daily checks
0 9 * * * wrangler analytics truenorth-chief-of-staff | mail -s "True North Daily Report" you@email.com
```

### 3. Clean Up Old Data

```bash
# Delete workflows older than 30 days
wrangler d1 execute truenorth-agents-db \
  --command="DELETE FROM workflows WHERE created_at < (unixepoch() - 2592000) * 1000"
```

### 4. Backup Important Decisions

```bash
# Export decision history
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM decisions" \
  --json > decisions_backup_$(date +%Y%m%d).json
```

## 🎉 Success Checklist

After completing this tutorial, you should have:

- [x] Deployed all 5 AI agents to Cloudflare
- [x] Created your first workflow
- [x] Monitored workflow progress
- [x] Reviewed agent outputs
- [x] Understood how decisions work
- [x] Explored the database
- [x] Learned basic troubleshooting

## 🚀 What's Next?

1. **Experiment**: Try different types of features
2. **Customize**: Modify agent prompts for your needs
3. **Scale**: Add more agents from the full 40+ agent system
4. **Integrate**: Connect to GitHub for automatic commits
5. **Monitor**: Set up alerting for failed workflows
6. **Optimize**: Fine-tune agent prompts based on results

## 📖 Additional Resources

- [Full Documentation](docs/README.md)
- [API Reference](docs/API-DOCUMENTATION.md)
- [Project Structure](docs/PROJECT-STRUCTURE.md)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Anthropic API Docs](https://docs.anthropic.com/)

## 💬 Need Help?

- Check logs: `wrangler tail truenorth-chief-of-staff`
- Query database: `wrangler d1 execute truenorth-agents-db --command="..."`
- View analytics: `wrangler analytics truenorth-chief-of-staff`

---

**Congratulations!** 🎉 You've successfully deployed and used your first AI agent system!

The agents are now working autonomously to build features for you. Focus on strategy, and let them handle the execution.