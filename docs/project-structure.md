# True North Tech - Project Structure

## 📁 Directory Layout

```
tntai/
├── src/                              # Source code for all agents
│   ├── chief-of-staff.js             # Main orchestrator worker
│   ├── agent-base-template.js        # Base class for all agents
│   ├── market-research-agent.js      # Market research agent
│   ├── ui-designer-agent.js          # UI/UX designer agent
│   ├── frontend-engineer-agent.js    # Frontend engineer agent
│   └── qa-engineer-agent.js          # QA engineer agent
│
├── database/                         # Database files
│   ├── truenorth-schema.sql          # Initial database schema
│   └── migrations/                   # Future database migrations
│       └── .gitkeep
│
├── config/                           # Configuration files
│   └── truenorth-wrangler.toml       # Cloudflare Workers configuration
│
├── scripts/                          # Deployment and utility scripts
│   ├── deploy-truenorth.sh           # Main deployment script
│   └── truenorth-cli.js              # CLI tool for interacting with agents
│
├── docs/                             # Documentation
│   ├── README.md                     # Main documentation (renamed from TRUENORTH-README.md)
│   ├── PROJECT-STRUCTURE.md          # This file
│   ├── API.md                        # API documentation
│   └── CONTRIBUTING.md               # Contribution guidelines
│
├── tests/                            # Tests (future)
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # End-to-end tests
│
├── .github/                          # GitHub specific files
│   └── workflows/                    # GitHub Actions (future)
│       └── deploy.yml                # Auto-deployment workflow
│
├── package.json                      # Node.js package configuration
├── .gitignore                        # Git ignore rules
├── .env.example                      # Example environment variables
└── LICENSE                           # MIT License

```

## 📋 File Descriptions

### Core Application Files

#### `src/chief-of-staff.js`
The main orchestrator that:
- Receives feature requests from users
- Breaks down requests into tasks
- Assigns tasks to appropriate agents
- Manages decision escalation
- Tracks workflow progress
- Provides API endpoints for status and outputs

**Key Functions:**
- `handleStartWorkflow()` - Initiates new workflows
- `handleGetStatus()` - Returns workflow progress
- `handleDecision()` - Processes user decisions
- `analyzeFeatureRequest()` - Uses Claude to break down requests

#### `src/agent-base-template.js`
Base class that all agents extend. Provides:
- Standard worker interface
- Task handling logic
- Memory management (KV storage)
- Decision escalation
- Error handling and retry logic
- Claude API integration

**Key Methods:**
- `handleTask()` - Main task processing
- `executeTask()` - Claude-powered task execution
- `loadMemory()` - Retrieve agent context
- `saveToMemory()` - Persist decisions
- `escalateDecision()` - Notify human of conflicts

#### `src/market-research-agent.js`
Specialized agent for competitive research:
- Analyzes competitor implementations
- Identifies industry best practices
- Gathers UX patterns
- Provides data-driven recommendations

**Capabilities:**
- Competitor analysis
- Best practice research
- UX pattern identification
- Trend analysis

#### `src/ui-designer-agent.js`
Specialized agent for interface design:
- Creates component specifications
- Defines user flows
- Ensures accessibility compliance
- Designs responsive layouts

**Capabilities:**
- Component structure design
- Visual design specifications
- Interaction definitions
- Accessibility guidelines
- Responsive breakpoint planning

#### `src/frontend-engineer-agent.js`
Specialized agent for code implementation:
- Generates React components
- Writes TypeScript/JavaScript
- Uses Tailwind CSS for styling
- Implements state management

**Capabilities:**
- React component development
- TypeScript/JavaScript coding
- Tailwind CSS styling
- State management
- Performance optimization

#### `src/qa-engineer-agent.js`
Specialized agent for quality assurance:
- Generates Playwright tests
- Creates test cases
- Validates accessibility
- Checks performance

**Capabilities:**
- Test automation
- Accessibility testing
- Visual regression testing
- Performance testing
- E2E test generation

### Configuration Files

#### `config/truenorth-wrangler.toml`
Cloudflare Workers configuration defining:
- Worker names and routes
- D1 database bindings
- KV namespace bindings
- Queue configurations
- Environment variables
- Secrets (API keys)

**Important:** After deployment, replace placeholder IDs with actual resource IDs.

#### `package.json`
NPM package configuration with:
- Project metadata
- CLI command (`truenorth`)
- Deployment scripts
- Development helpers
- Logging commands

### Database Files

#### `database/truenorth-schema.sql`
Initial database schema with tables:
- `agent_outputs` - Agent task results
- `decisions` - Decision logs
- `workflows` - Workflow state tracking
- `agent_messages` - Inter-agent communication
- `agent_memory` - Agent context and knowledge
- `task_queue` - Task management
- `system_metrics` - Performance metrics
- `audit_log` - System audit trail

### Scripts

#### `scripts/deploy-truenorth.sh`
Automated deployment script that:
1. Verifies Wrangler CLI installation
2. Creates D1 database
3. Initializes database schema
4. Creates KV namespaces
5. Creates message queue
6. Updates configuration with resource IDs
7. Sets up secrets
8. Deploys all workers

**Safety Features:**
- Confirms no conflicts with IdeaGraph
- Validates resource naming
- Checks for required credentials

#### `scripts/truenorth-cli.js`
Command-line interface for:
- Starting new workflows
- Checking workflow status
- Viewing workflow outputs
- Making decisions

**Commands:**
- `truenorth start` - Start workflow
- `truenorth status <id>` - Get status
- `truenorth outputs <id>` - Get outputs
- `truenorth decide <id> <dec>` - Make decision

## 🔧 Setup Instructions

### 1. Initial Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/tntai.git
cd tntai

# Create proper directory structure
mkdir -p src database config scripts docs tests/{unit,integration,e2e}

# Move files to correct locations
mv chief-of-staff.js src/
mv agent-base-template.js src/
mv market-research-agent.js src/
mv ui-designer-agent.js src/
mv frontend-engineer-agent.js src/
mv qa-engineer-agent.js src/
mv truenorth-schema.sql database/
mv truenorth-wrangler.toml config/
mv deploy-truenorth.sh scripts/
mv truenorth-cli.js scripts/
mv TRUENORTH-README.md docs/README.md
mv PROJECT-STRUCTURE.md docs/

# Install dependencies
npm install

# Make CLI executable
chmod +x scripts/truenorth-cli.js
npm link  # Makes 'truenorth' command available globally
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your credentials
nano .env
```

`.env` should contain:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-...
GITHUB_TOKEN=ghp_...
TRUENORTH_URL=https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev
```

### 3. Deployment

```bash
# Run deployment script
./scripts/deploy-truenorth.sh

# Or use npm script
npm run deploy
```

### 4. Testing

```bash
# Test Chief of Staff
truenorth start

# Or use curl
curl -X POST $TRUENORTH_URL/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{"feature_request": "Create a todo list"}'
```

## 📊 Resource Naming Convention

All True North resources use the `truenorth-` prefix:

### Workers
- `truenorth-chief-of-staff` - Main orchestrator
- `truenorth-market-research` - Market research agent
- `truenorth-ui-designer` - UI/UX designer agent
- `truenorth-frontend-engineer` - Frontend engineer agent
- `truenorth-qa-engineer` - QA engineer agent

### Database
- `truenorth-agents-db` - Main D1 database

### KV Namespaces
- `truenorth-agent-memory` - Agent memory/context
- `truenorth-agent-decisions` - Decision history
- `truenorth-agent-context` - Workflow context

### Queues
- `truenorth-agent-queue` - Agent communication queue

## 🚫 Isolation from IdeaGraph

**Critical:** Never modify these resources:
- Worker: `ideagraph`
- D1 Database: `ideagraph-db`
- R2 Bucket: `ideagraph-media`

All True North resources are completely separate and isolated.

## 🔍 Monitoring

### View Logs
```bash
# Chief of Staff logs
npm run logs:chief

# Specific agent logs
npm run logs:research
npm run logs:designer
npm run logs:engineer
npm run logs:qa
```

### Query Database
```bash
# View workflows
npm run db:query -- --command="SELECT * FROM workflows LIMIT 10"

# View agent outputs
npm run db:query -- --command="SELECT * FROM agent_outputs ORDER BY timestamp DESC LIMIT 20"

# View pending decisions
npm run db:query -- --command="SELECT * FROM decisions WHERE decision IS NULL"
```

### Analytics
```bash
# Worker analytics
wrangler analytics truenorth-chief-of-staff

# Queue metrics
wrangler queues list
```

## 🛠️ Development

### Local Development
```bash
# Run Chief of Staff locally
npm run dev:chief

# Run specific agent locally
npm run dev:research
npm run dev:designer
npm run dev:engineer
npm run dev:qa
```

### Making Changes

1. Edit agent files in `src/`
2. Test locally with `npm run dev:*`
3. Deploy changes with `wrangler deploy`

### Adding New Agents

1. Create new agent file in `src/` (e.g., `src/new-agent.js`)
2. Extend `BaseAgent` class
3. Add configuration to `config/truenorth-wrangler.toml`
4. Deploy with `wrangler deploy --env new-agent`

## 📝 Best Practices

### Code Organization
- Keep agent logic in separate files
- Use the base template for consistency
- Document complex logic with comments
- Follow existing naming conventions

### Database
- Always use prepared statements
- Add indexes for frequently queried columns
- Clean up old data periodically
- Use transactions for multi-step operations

### Error Handling
- Always wrap API calls in try-catch
- Log errors with context
- Implement retry logic for transient failures
- Provide meaningful error messages

### Security
- Never commit API keys
- Use Cloudflare secrets for sensitive data
- Validate all user inputs
- Rate limit user-facing endpoints

## 🎯 Next Steps

After setup:
1. Test the 5-agent MVP with real workflows
2. Monitor performance and costs
3. Iterate on agent prompts based on results
4. Consider adding more agents (Phase 2)
5. Implement GitHub integration
6. Add web dashboard for workflow visualization

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [D1 Database Guide](https://developers.cloudflare.com/d1/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)