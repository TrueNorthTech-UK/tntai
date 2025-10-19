-- True North Tech AI Agent System Database Schema
-- Deploy this to your D1 database: truenorth-agents-db

-- Agent outputs and task results
CREATE TABLE IF NOT EXISTS agent_outputs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_name TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  output TEXT NOT NULL,
  confidence_score REAL,
  timestamp INTEGER NOT NULL,
  status TEXT DEFAULT 'complete' CHECK(status IN ('complete', 'failed', 'pending')),
  created_at INTEGER DEFAULT (unixepoch()),
  INDEX idx_agent_task (agent_name, task_id),
  INDEX idx_timestamp (timestamp)
);

-- Decision logs for human and agent decisions
CREATE TABLE IF NOT EXISTS decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  decision_id TEXT UNIQUE NOT NULL,
  workflow_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  options TEXT NOT NULL,
  recommendation TEXT,
  decision TEXT,
  decided_by TEXT NOT NULL,
  reasoning TEXT,
  timestamp INTEGER NOT NULL,
  impact_level TEXT CHECK(impact_level IN ('low', 'medium', 'high')),
  created_at INTEGER DEFAULT (unixepoch()),
  INDEX idx_workflow (workflow_id),
  INDEX idx_decided_by (decided_by)
);

-- Workflow state tracking
CREATE TABLE IF NOT EXISTS workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id TEXT UNIQUE NOT NULL,
  feature_request TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'blocked', 'complete', 'failed')),
  current_step TEXT NOT NULL,
  context TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  INDEX idx_status (status),
  INDEX idx_created (created_at)
);

-- Agent-to-agent messages
CREATE TABLE IF NOT EXISTS agent_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id TEXT UNIQUE NOT NULL,
  from_agent TEXT NOT NULL,
  to_agent TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK(message_type IN ('task', 'question', 'response', 'status', 'escalation')),
  message TEXT NOT NULL,
  workflow_id TEXT,
  timestamp INTEGER NOT NULL,
  read INTEGER DEFAULT 0,
  parent_message_id TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  INDEX idx_workflow (workflow_id),
  INDEX idx_to_agent (to_agent, read),
  INDEX idx_timestamp (timestamp)
);

-- Agent memory and context
CREATE TABLE IF NOT EXISTS agent_memory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_name TEXT NOT NULL,
  memory_type TEXT NOT NULL CHECK(memory_type IN ('decision', 'pattern', 'preference', 'constraint')),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  context TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch()),
  expires_at INTEGER,
  UNIQUE(agent_name, memory_type, key),
  INDEX idx_agent (agent_name),
  INDEX idx_expires (expires_at)
);

-- Task queue
CREATE TABLE IF NOT EXISTS task_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT UNIQUE NOT NULL,
  workflow_id TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  task_type TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  input TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'complete', 'failed', 'cancelled')),
  dependencies TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at INTEGER DEFAULT (unixepoch()),
  started_at INTEGER,
  completed_at INTEGER,
  INDEX idx_assigned (assigned_to, status),
  INDEX idx_workflow (workflow_id),
  INDEX idx_priority (priority, status)
);

-- System metrics and monitoring
CREATE TABLE IF NOT EXISTS system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value REAL NOT NULL,
  labels TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  INDEX idx_metric (metric_type, metric_name),
  INDEX idx_timestamp (timestamp)
);

-- Audit log for all system actions
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details TEXT,
  timestamp INTEGER NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  INDEX idx_actor (actor),
  INDEX idx_timestamp (timestamp)
);