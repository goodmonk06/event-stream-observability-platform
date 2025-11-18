-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  api_key VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_projects_api_key ON projects(api_key);

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
