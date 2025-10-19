# True North Tech - API Documentation

## Base URL

```
https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev
```

Replace `YOUR_SUBDOMAIN` with your actual Cloudflare Workers subdomain.

## Authentication

Currently, the MVP does not require authentication. Future versions will implement API key authentication.

## Rate Limits

- **Free tier**: 100,000 requests per day
- **Per IP**: 1,000 requests per hour
- **Concurrent workflows**: 10 (configurable)

## Endpoints

### 1. Health Check

Check if the Chief of Staff is operational.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "agent": "chief-of-staff"
}
```

**Status Codes:**
- `200 OK` - Service is healthy
- `500 Internal Server Error` - Service is down

---

### 2. Start Workflow

Initiate a new feature development workflow.

**Endpoint:** `POST /workflow/start`

**Request Body:**
```json
{
  "feature_request": "Add a dark mode toggle to the header",
  "priority": 5
}
```

**Parameters:**
- `feature_request` (string, required) - Description of the feature to build
- `priority` (integer, optional) - Priority level 1-10, default: 5

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

**Status Codes:**
- `200 OK` - Workflow created successfully
- `400 Bad Request` - Invalid request body
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{
    "feature_request": "Create a responsive user profile card with avatar, name, bio, and social links",
    "priority": 7
  }'
```

---

### 3. Get Workflow Status

Retrieve the current status and progress of a workflow.

**Endpoint:** `GET /workflow/:workflow_id/status`

**Parameters:**
- `workflow_id` (string, required) - The workflow ID returned from `/workflow/start`

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
  "pending_decisions": [
    {
      "decision_id": "dec_1729363500_xyz789",
      "title": "Icon Selection for Dark Mode Toggle",
      "impact_level": "low"
    }
  ],
  "created_at": 1729363200000,
  "updated_at": 1729363800000
}
```

**Response Fields:**
- `workflow_id` - Unique workflow identifier
- `status` - Current status: `pending`, `in_progress`, `blocked`, `complete`, `failed`
- `current_step` - Current phase: `research`, `design`, `development`, `testing`, `complete`
- `progress` - Completion percentage (0-100)
- `tasks` - Task breakdown by status
- `pending_decisions` - Decisions requiring human input
- `created_at` - Unix timestamp (milliseconds)
- `updated_at` - Unix timestamp (milliseconds)

**Status Codes:**
- `200 OK` - Status retrieved successfully
- `404 Not Found` - Workflow not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/wf_1729363200_abc123/status
```

---

### 4. Make Decision

Submit a decision for a workflow that requires human input.

**Endpoint:** `POST /workflow/:workflow_id/decision`

**Parameters:**
- `workflow_id` (string, required) - The workflow ID

**Request Body:**
```json
{
  "decision_id": "dec_1729363500_xyz789",
  "choice": "option_a",
  "reasoning": "This approach is faster to implement and maintains consistency with existing design"
}
```

**Parameters:**
- `decision_id` (string, required) - The decision ID from pending_decisions
- `choice` (string, required) - The chosen option (e.g., "option_a", "option_b")
- `reasoning` (string, optional) - Explanation for the decision

**Response:**
```json
{
  "status": "acknowledged",
  "decision_id": "dec_1729363500_xyz789",
  "choice": "option_a",
  "message": "Decision executed successfully"
}
```

**Status Codes:**
- `200 OK` - Decision recorded successfully
- `400 Bad Request` - Invalid decision_id or choice
- `404 Not Found` - Workflow or decision not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/wf_1729363200_abc123/decision \
  -H 'Content-Type: application/json' \
  -d '{
    "decision_id": "dec_1729363500_xyz789",
    "choice": "option_a",
    "reasoning": "Faster implementation"
  }'
```

---

### 5. Get Workflow Outputs

Retrieve all outputs and results from a workflow.

**Endpoint:** `GET /workflow/:workflow_id/outputs`

**Parameters:**
- `workflow_id` (string, required) - The workflow ID

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
    },
    {
      "agent": "frontend-engineer",
      "task_type": "implement",
      "timestamp": 1729363900000,
      "confidence": 0.88,
      "status": "complete"
    },
    {
      "agent": "qa-engineer",
      "task_type": "test",
      "timestamp": 1729364200000,
      "confidence": 0.95,
      "status": "complete"
    }
  ],
  "summary": "Market research identified 5 competitor implementations with best practices. UI design created a responsive component with full accessibility support. Frontend implementation generated clean React code with Tailwind CSS. QA testing achieved 95% code coverage with all tests passing."
}
```

**Response Fields:**
- `workflow_id` - Unique workflow identifier
- `outputs` - Array of agent outputs
  - `agent` - Agent name
  - `task_type` - Type of task performed
  - `timestamp` - Unix timestamp (milliseconds)
  - `confidence` - Confidence score (0-1)
  - `status` - Output status: `complete`, `failed`, `pending`
- `summary` - AI-generated executive summary

**Status Codes:**
- `200 OK` - Outputs retrieved successfully
- `404 Not Found` - Workflow not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/wf_1729363200_abc123/outputs
```

---

## Agent-Specific Endpoints

Each agent has its own worker endpoint for direct communication (typically not used by end users).

### Agent Health Check

**Endpoint:** `GET /health`

**Available Agents:**
- `truenorth-market-research.YOUR_SUBDOMAIN.workers.dev`
- `truenorth-ui-designer.YOUR_SUBDOMAIN.workers.dev`
- `truenorth-frontend-engineer.YOUR_SUBDOMAIN.workers.dev`
- `truenorth-qa-engineer.YOUR_SUBDOMAIN.workers.dev`

**Response:**
```json
{
  "status": "healthy",
  "agent": "market-research",
  "capabilities": ["competitor-analysis", "best-practices", "ux-patterns"]
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid request parameters or body
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

---

## WebSocket Support (Future)

Real-time workflow updates via WebSocket will be added in a future version.

**Planned Endpoint:** `wss://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/:workflow_id/stream`

---

## Rate Limit Headers

Response headers include rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1729367200
```

---

## Pagination (Future)

For endpoints returning lists, pagination will be supported:

**Query Parameters:**
- `page` (integer) - Page number (default: 1)
- `per_page` (integer) - Items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 5,
    "total_items": 100
  }
}
```

---

## Webhooks (Future)

Register webhooks to receive notifications about workflow events:

**Events:**
- `workflow.started`
- `workflow.completed`
- `workflow.failed`
- `workflow.blocked`
- `decision.required`

---

## Client Libraries (Future)

Official client libraries planned for:
- JavaScript/TypeScript
- Python
- Go
- Ruby

---

## Examples

### Complete Workflow Example

```bash
# 1. Start workflow
WORKFLOW_ID=$(curl -X POST https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/start \
  -H 'Content-Type: application/json' \
  -d '{"feature_request": "Add dark mode toggle"}' \
  | jq -r '.workflow_id')

echo "Workflow ID: $WORKFLOW_ID"

# 2. Poll status every 30 seconds
while true; do
  STATUS=$(curl -s https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/$WORKFLOW_ID/status | jq -r '.status')
  echo "Status: $STATUS"
  
  if [ "$STATUS" = "complete" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  
  sleep 30
done

# 3. Get outputs
curl https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev/workflow/$WORKFLOW_ID/outputs | jq
```

### JavaScript/Node.js Example

```javascript
const axios = require('axios');

const BASE_URL = 'https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev';

async function startWorkflow(featureRequest) {
  const response = await axios.post(`${BASE_URL}/workflow/start`, {
    feature_request: featureRequest
  });
  
  return response.data.workflow_id;
}

async function pollWorkflow(workflowId) {
  while (true) {
    const response = await axios.get(`${BASE_URL}/workflow/${workflowId}/status`);
    const { status, progress, pending_decisions } = response.data;
    
    console.log(`Status: ${status}, Progress: ${progress}%`);
    
    if (pending_decisions.length > 0) {
      console.log('Decisions required:', pending_decisions);
      break;
    }
    
    if (status === 'complete' || status === 'failed') {
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
  }
}

async function main() {
  const workflowId = await startWorkflow('Add a user profile card component');
  console.log('Workflow started:', workflowId);
  
  await pollWorkflow(workflowId);
  
  const outputs = await axios.get(`${BASE_URL}/workflow/${workflowId}/outputs`);
  console.log('Results:', outputs.data);
}

main();
```

### Python Example

```python
import requests
import time
import json

BASE_URL = 'https://truenorth-chief-of-staff.YOUR_SUBDOMAIN.workers.dev'

def start_workflow(feature_request):
    response = requests.post(
        f'{BASE_URL}/workflow/start',
        json={'feature_request': feature_request}
    )
    return response.json()['workflow_id']

def poll_workflow(workflow_id):
    while True:
        response = requests.get(f'{BASE_URL}/workflow/{workflow_id}/status')
        data = response.json()
        
        print(f"Status: {data['status']}, Progress: {data['progress']}%")
        
        if data.get('pending_decisions'):
            print('Decisions required:', data['pending_decisions'])
            break
        
        if data['status'] in ['complete', 'failed']:
            break
        
        time.sleep(30)

def main():
    workflow_id = start_workflow('Add dark mode toggle')
    print(f'Workflow started: {workflow_id}')
    
    poll_workflow(workflow_id)
    
    outputs = requests.get(f'{BASE_URL}/workflow/{workflow_id}/outputs')
    print('Results:', json.dumps(outputs.json(), indent=2))

if __name__ == '__main__':
    main()
```

---

## Support

For API issues or questions:
- Check the [troubleshooting guide](docs/README.md#troubleshooting)
- View logs: `wrangler tail truenorth-chief-of-staff`
- Open an issue on GitHub

---

**Last Updated:** October 19, 2025  
**API Version:** 1.0.0 (MVP)