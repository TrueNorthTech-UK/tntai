# True North Tech AI Agent System

> An autonomous AI-powered development team that builds, tests, and deploys software with minimal human intervention.

## 🌟 Overview

True North Tech is a hierarchical system of specialized AI agents that work together to autonomously develop software features. The MVP includes 5 core agents:

1. **Chief of Staff** - Orchestrates workflows and facilitates decisions
2. **Market Research Agent** - Competitive intelligence and best practices
3. **UI/UX Designer Agent** - Interface design and user experience
4. **Frontend Engineer Agent** - React component implementation
5. **QA Engineer Agent** - Automated testing and quality assurance

## 🏗️ Architecture

```
User Request → Chief of Staff → [Research → Design → Build → Test] → Deployed Code
```

### Key Features

- ✅ **95% Autonomous**: Agents handle routine decisions independently
- ✅ **Strategic Escalation**: Only important decisions reach you
- ✅ **Complete Workflow**: From idea to tested code in <2 hours
- ✅ **Built on Cloudflare**: Serverless, globally distributed, cost-effective
- ✅ **Powered by Claude**: Anthropic's Claude Sonnet 4 for reasoning

## 📋 Prerequisites

Before deployment, ensure you have:

- [ ] Cloudflare account (ID: `3084a71c3a01c15a95432e43c1abb895`)
- [ ] Anthropic API key ([Get one here](https://console.anthropic.com/))
- [ ] GitHub Personal Access Token (optional, for code commits)
- [ ] Node.js 18+ and npm installed
- [ ] Wrangler CLI: `npm install -g wrangler`

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tntai.git
cd tntai

# Install dependencies
npm install

# Login to Cloudflare
wrangler login
```

### 2. Configure Credentials

```bash
# Set your Anthropic API key
export ANTHROPIC_API_KEY="sk-ant-api03-..."

# Set your GitHub token (optional)
export GITHUB_TOKEN="ghp_..."
```

### 3. Deploy Everything

```bash
# Make the deployment script executable
chmod +x deploy-truenorth.sh

# Run the deployment
./deploy-truenorth.sh
```

The script will:
- ✅ Create D1 database with schema
- ✅ Create 3 KV namespaces
- ✅ Create message queue
- ✅ Deploy all 5 agent workers
- ✅ Configure secrets

### 4. Test Your System

```bash
# Start a workflow
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{"feature_request": "Create a todo list component with add, delete, and toggle complete functionality"}'

# Response:
{
  "workflow_id": "wf_1729363200_abc123",
  "status": "in_progress",
  "estimated_time": "45 minutes",
  "tasks_created": 4
}

# Check status
curl https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/wf_1729363200_abc123/status

# Get outputs
curl https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/wf_1729363200_abc123/outputs
```

## 📚 API Documentation

### Start Workflow

**Endpoint:** `POST /workflow/start`

**Request:**
```json
{
  "feature_request": "Description of the feature to build",
  "priority": 5  // Optional: 1-10, default 5
}
```

**Response:**
```json
{
  "workflow_id": "wf_1729363200_abc123",
  "status": "in_progress",
  "estimated_time": "45 minutes",
  "tasks_created": 4,
  "message": "Workflow started successfully"
}
```

### Get Workflow Status

**Endpoint:** `GET /workflow/:id/status`

**Response:**
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
    "in_progress": 1,
    "failed": 0
  },
  "pending_decisions": [],
  "created_at": 1729363200000,
  "updated_at": 1729363800000
}
```

### Make Decision

**Endpoint:** `POST /workflow/:id/decision`

**Request:**
```json
{
  "decision_id": "dec_1729363500_xyz789",
  "choice": "option_a",
  "reasoning": "This approach is faster to implement"
}
```

**Response:**
```json
{
  "status": "acknowledged",
  "decision_id": "dec_1729363500_xyz789",
  "choice": "option_a",
  "message": "Decision executed successfully"
}
```

### Get Workflow Outputs

**Endpoint:** `GET /workflow/:id/outputs`

**Response:**
```json
{
  "workflow_id": "wf_1729363200_abc123",
  "outputs": [
    {
      "agent": "market-research",
      "task_type": "research",
      "timestamp": 1729363300000,
      "confidence": 0.85,
      "status": "complete"
    },
    {
      "agent": "ui-designer",
      "task_type": "design",
      "timestamp": 1729363600000,
      "confidence": 0.92,
      "status": "complete"
    }
  ],
  "summary": "Research found 5 competitor implementations. Design created a responsive component with accessibility features. Code generated with 95% test coverage."
}
```

## 🔧 Manual Setup (Alternative)

If you prefer manual setup:

### 1. Create D1 Database

```bash
wrangler d1 create truenorth-agents-db --experimental-backend

# Note the database_id from output
# Update truenorth-wrangler.toml with the ID
```

### 2. Initialize Schema

```bash
wrangler d1 execute truenorth-agents-db --file=./truenorth-schema.sql
```

### 3. Create KV Namespaces

```bash
wrangler kv:namespace create "truenorth-agent-memory"
wrangler kv:namespace create "truenorth-agent-decisions"
wrangler kv:namespace create "truenorth-agent-context"

# Update truenorth-wrangler.toml with the IDs
```

### 4. Create Queue

```bash
wrangler queues create truenorth-agent-queue
```

### 5. Set Secrets

```bash
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put GITHUB_TOKEN  # Optional
```

### 6. Deploy Workers

```bash
# Chief of Staff
wrangler deploy -c truenorth-wrangler.toml

# Agents
wrangler deploy -c truenorth-wrangler.toml --env market-research
wrangler deploy -c truenorth-wrangler.toml --env ui-designer
wrangler deploy -c truenorth-wrangler.toml --env frontend-engineer
wrangler deploy -c truenorth-wrangler.toml --env qa-engineer
```

## 📊 Monitoring & Debugging

### View Logs

```bash
# Watch Chief of Staff logs
wrangler tail truenorth-chief-of-staff

# Watch specific agent logs
wrangler tail truenorth-market-research
```

### Query Database

```bash
# View all workflows
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM workflows ORDER BY created_at DESC LIMIT 10"

# View agent outputs
wrangler d1 execute truenorth-agents-db \
  --command="SELECT agent_name, task_type, status, timestamp FROM agent_outputs ORDER BY timestamp DESC LIMIT 20"

# View pending decisions
wrangler d1 execute truenorth-agents-db \
  --command="SELECT * FROM decisions WHERE decision IS NULL"
```

### Check Resource Usage

```bash
# Analytics
wrangler analytics truenorth-chief-of-staff

# Queue metrics
wrangler queues list
```

## 🛡️ Safety & Isolation

**CRITICAL:** This system is completely isolated from your IdeaGraph application.

### Protected IdeaGraph Resources
- ❌ Worker: `ideagraph` (never modified)
- ❌ D1 Database: `ideagraph-db` (ID: b8ae71ae-7012-47f7-bd91-dde6e5449b12)
- ❌ R2 Bucket: `ideagraph-media` (never touched)

### True North Resources
- ✅ All workers prefixed with `truenorth-`
- ✅ Separate D1 database: `truenorth-agents-db`
- ✅ Separate KV namespaces: `truenorth-*`
- ✅ Separate queue: `truenorth-agent-queue`
- ✅ Separate configuration file: `truenorth-wrangler.toml`

## 💰 Cost Estimates

### Cloudflare (per month)
- Workers: ~$5 (100k requests free, then $0.50/million)
- D1 Database: ~$2 (5GB storage free, then $0.75/GB)
- KV: ~$1 (1GB free, then $0.50/GB)
- Queues: ~$2 (1M operations free)

**Total Cloudflare: ~$10/month**

### Anthropic API (per month)
- Claude Sonnet 4: ~$50-100
  - Input: $3/million tokens
  - Output: $15/million tokens
  - Typical workflow: ~50k tokens = $0.50

**Total: ~$60-110/month** for moderate usage (100+ workflows)

## 🎯 Example Workflows

### Example 1: Dark Mode Toggle

```bash
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{
    "feature_request": "Add a dark mode toggle to the header. It should respect system preference, persist the choice, and smoothly animate between modes."
  }'
```

**What happens:**
1. Market Research finds best practices for dark mode implementation
2. UI Designer creates component spec with smooth transitions
3. Frontend Engineer implements the toggle with localStorage
4. QA Engineer generates tests for all states
5. Complete in ~45 minutes

### Example 2: User Profile Card

```bash
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{
    "feature_request": "Create a user profile card component showing avatar, name, bio, and social links. Make it responsive and accessible."
  }'
```

### Example 3: Form Validation

```bash
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{
    "feature_request": "Build a signup form with email, password, and password confirmation. Include real-time validation, error messages, and loading states."
  }'
```

## 🔄 Updating & Maintenance

### Update Agent Prompts

Edit the agent files in `src/` and redeploy:

```bash
wrangler deploy -c truenorth-wrangler.toml --env market-research
```

### Update Database Schema

```bash
# Create migration file
wrangler d1 migrations create truenorth-agents-db "add_new_table"

# Apply migration
wrangler d1 migrations apply truenorth-agents-db
```

### Monitor Costs

```bash
# Check Cloudflare usage
wrangler analytics truenorth-chief-of-staff

# Anthropic API usage: Check dashboard at console.anthropic.com
```

## 🐛 Troubleshooting

### Workers Not Responding

```bash
# Check worker status
wrangler deployments list --name truenorth-chief-of-staff

# View recent errors
wrangler tail truenorth-chief-of-staff --format=pretty
```

### Database Connection Issues

```bash
# Verify D1 database exists
wrangler d1 list | grep truenorth

# Test connection
wrangler d1 execute truenorth-agents-db --command="SELECT 1"
```

### Queue Not Processing

```bash
# Check queue status
wrangler queues list

# View queue consumers
wrangler queues consumer list truenorth-agent-queue
```

### Agent Timeouts

Agents have 30-second timeout by default. For long-running tasks:

```bash
# Check worker settings
wrangler tail truenorth-frontend-engineer --status=error
```

## 🚧 Roadmap

### Phase 2: Full System (Next)
- [ ] Deploy remaining 35+ agents
- [ ] Add VP/manager coordination layer
- [ ] Implement learning from past workflows
- [ ] Advanced decision tree logic

### Phase 3: Integrations
- [ ] Sentry integration for auto-healing
- [ ] GitHub PR automation
- [ ] Figma API for visual designs
- [ ] Slack notifications

### Phase 4: Intelligence
- [ ] Agent learning from feedback
- [ ] Automatic prompt optimization
- [ ] Predictive task estimation
- [ ] Proactive feature suggestions

## 📖 Additional Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database Guide](https://developers.cloudflare.com/d1/)

## 🤝 Contributing

This is a personal project, but ideas welcome! Open an issue to discuss.

## 📝 License

MIT License - See LICENSE file

## 💬 Support

Questions? Issues?
- Check the troubleshooting section above
- View logs: `wrangler tail truenorth-chief-of-staff`
- Check database: `wrangler d1 execute truenorth-agents-db --command="SELECT * FROM workflows"`

---

**Built with ❤️ using Claude Sonnet 4 and Cloudflare Workers**