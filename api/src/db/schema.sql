-- Projects table (enhanced)
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  last_activity_at TIMESTAMP,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_api_key ON projects(api_key);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_tags ON projects USING gin(tags);

-- Log events table
CREATE TABLE IF NOT EXISTS log_events (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  context_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_log_events_project_id ON log_events(project_id);
CREATE INDEX idx_log_events_timestamp ON log_events(timestamp DESC);
CREATE INDEX idx_log_events_level ON log_events(level);
CREATE INDEX idx_log_events_message_fulltext ON log_events USING gin(to_tsvector('english', message));
CREATE INDEX idx_log_events_project_timestamp ON log_events(project_id, timestamp DESC);

-- Metric points table
CREATE TABLE IF NOT EXISTS metric_points (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('counter', 'gauge')),
  value DOUBLE PRECISION NOT NULL,
  labels_json JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metric_points_project_id ON metric_points(project_id);
CREATE INDEX idx_metric_points_name ON metric_points(name);
CREATE INDEX idx_metric_points_timestamp ON metric_points(timestamp DESC);
CREATE INDEX idx_metric_points_type ON metric_points(type);
CREATE INDEX idx_metric_points_project_name_timestamp ON metric_points(project_id, name, timestamp DESC);

-- Custom events table
CREATE TABLE IF NOT EXISTS custom_events (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  payload_json JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_custom_events_project_id ON custom_events(project_id);
CREATE INDEX idx_custom_events_name ON custom_events(name);
CREATE INDEX idx_custom_events_timestamp ON custom_events(timestamp DESC);
CREATE INDEX idx_custom_events_project_name_timestamp ON custom_events(project_id, name, timestamp DESC);

-- Alert rules table
CREATE TABLE IF NOT EXISTS alert_rules (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('metric_threshold', 'log_pattern', 'event_count')),
  condition JSONB NOT NULL, -- {metric_name, operator, threshold, window_minutes, etc.}
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  notification_channels TEXT[] DEFAULT '{}', -- ['email', 'webhook', 'slack']
  severity VARCHAR(20) DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  cooldown_minutes INTEGER DEFAULT 5,
  last_evaluated_at TIMESTAMP,
  last_triggered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_rules_project_id ON alert_rules(project_id);
CREATE INDEX idx_alert_rules_status ON alert_rules(status);
CREATE INDEX idx_alert_rules_type ON alert_rules(rule_type);

-- Alert history table
CREATE TABLE IF NOT EXISTS alert_history (
  id BIGSERIAL PRIMARY KEY,
  alert_rule_id INTEGER NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'triggered' CHECK (status IN ('triggered', 'resolved', 'acknowledged')),
  trigger_value DOUBLE PRECISION,
  trigger_details JSONB,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_history_alert_rule_id ON alert_history(alert_rule_id);
CREATE INDEX idx_alert_history_project_id ON alert_history(project_id);
CREATE INDEX idx_alert_history_triggered_at ON alert_history(triggered_at DESC);
CREATE INDEX idx_alert_history_status ON alert_history(status);

-- Saved queries table
CREATE TABLE IF NOT EXISTS saved_queries (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  query_type VARCHAR(50) NOT NULL CHECK (query_type IN ('logs', 'metrics', 'events')),
  filters JSONB NOT NULL, -- {level, search, metric_name, time_range, etc.}
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_saved_queries_project_id ON saved_queries(project_id);
CREATE INDEX idx_saved_queries_type ON saved_queries(query_type);
CREATE INDEX idx_saved_queries_tags ON saved_queries USING gin(tags);

-- Dashboards table
CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout JSONB NOT NULL, -- {widgets: [{type, config, position}]}
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dashboards_project_id ON dashboards(project_id);
CREATE INDEX idx_dashboards_tags ON dashboards USING gin(tags);

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  secret VARCHAR(255),
  events TEXT[] NOT NULL, -- ['alert.triggered', 'log.error', 'metric.threshold']
  headers JSONB, -- Custom HTTP headers
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'failed')),
  retry_policy JSONB DEFAULT '{"max_retries": 3, "backoff": "exponential"}',
  last_triggered_at TIMESTAMP,
  last_success_at TIMESTAMP,
  last_failure_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhooks_project_id ON webhooks(project_id);
CREATE INDEX idx_webhooks_status ON webhooks(status);

-- API tokens table (separate from project API keys for fine-grained access)
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  scopes TEXT[] NOT NULL, -- ['read:logs', 'write:metrics', 'admin']
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_tokens_token ON api_tokens(token);
CREATE INDEX idx_api_tokens_project_id ON api_tokens(project_id);
CREATE INDEX idx_api_tokens_status ON api_tokens(status);

-- Data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('logs', 'metrics', 'events')),
  retention_days INTEGER NOT NULL,
  action VARCHAR(20) DEFAULT 'delete' CHECK (action IN ('delete', 'archive')),
  archive_location TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, data_type)
);

CREATE INDEX idx_retention_policies_project_id ON data_retention_policies(project_id);
CREATE INDEX idx_retention_policies_enabled ON data_retention_policies(enabled);

-- Audit log table (track important actions)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  actor VARCHAR(255), -- user or system identifier
  action VARCHAR(100) NOT NULL, -- 'project.created', 'alert.triggered', etc.
  resource_type VARCHAR(50),
  resource_id VARCHAR(100),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_project_id ON audit_logs(project_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor);
