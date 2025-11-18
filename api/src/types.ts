export interface Project {
  id: number;
  name: string;
  api_key: string;
  status: 'active' | 'archived' | 'suspended';
  tags: string[];
  metadata: Record<string, any>;
  last_activity_at: Date | null;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface LogEvent {
  id: number;
  project_id: number;
  timestamp: Date;
  level: string;
  message: string;
  context_json?: Record<string, any>;
  created_at: Date;
}

export interface MetricPoint {
  id: number;
  project_id: number;
  name: string;
  type: 'counter' | 'gauge';
  value: number;
  labels_json?: Record<string, string>;
  timestamp: Date;
  created_at: Date;
}

export interface CustomEvent {
  id: number;
  project_id: number;
  name: string;
  payload_json?: Record<string, any>;
  timestamp: Date;
  created_at: Date;
}

// Alert Rule types
export interface AlertRule {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  rule_type: 'metric_threshold' | 'log_pattern' | 'event_count';
  condition: AlertCondition;
  status: 'active' | 'paused' | 'deleted';
  notification_channels: string[];
  severity: 'info' | 'warning' | 'error' | 'critical';
  cooldown_minutes: number;
  last_evaluated_at: Date | null;
  last_triggered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type AlertCondition =
  | MetricThresholdCondition
  | LogPatternCondition
  | EventCountCondition;

export interface MetricThresholdCondition {
  metric_name: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  window_minutes: number;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}

export interface LogPatternCondition {
  level?: string;
  pattern: string;
  count_threshold: number;
  window_minutes: number;
}

export interface EventCountCondition {
  event_name: string;
  count_threshold: number;
  window_minutes: number;
}

export interface AlertHistory {
  id: number;
  alert_rule_id: number;
  project_id: number;
  triggered_at: Date;
  resolved_at: Date | null;
  status: 'triggered' | 'resolved' | 'acknowledged';
  trigger_value: number | null;
  trigger_details: Record<string, any> | null;
  notification_sent: boolean;
  created_at: Date;
}

// Saved Query types
export interface SavedQuery {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  query_type: 'logs' | 'metrics' | 'events';
  filters: QueryFilters;
  is_public: boolean;
  tags: string[];
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export type QueryFilters = LogQueryFilters | MetricQueryFilters | EventQueryFilters;

export interface LogQueryFilters {
  level?: string;
  search?: string;
  start_time?: string;
  end_time?: string;
}

export interface MetricQueryFilters {
  name?: string;
  type?: 'counter' | 'gauge';
  start_time?: string;
  end_time?: string;
  labels?: Record<string, string>;
}

export interface EventQueryFilters {
  name?: string;
  start_time?: string;
  end_time?: string;
}

// Dashboard types
export interface Dashboard {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  layout: DashboardLayout;
  is_public: boolean;
  tags: string[];
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'logs' | 'metrics_chart' | 'event_list' | 'metric_value' | 'alert_status';
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; width: number; height: number };
}

export type WidgetConfig = any; // Flexible for different widget types

// Webhook types
export interface Webhook {
  id: number;
  project_id: number;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  headers: Record<string, string> | null;
  status: 'active' | 'paused' | 'failed';
  retry_policy: RetryPolicy;
  last_triggered_at: Date | null;
  last_success_at: Date | null;
  last_failure_at: Date | null;
  failure_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface RetryPolicy {
  max_retries: number;
  backoff: 'linear' | 'exponential';
}

// API Token types
export interface ApiToken {
  id: number;
  project_id: number;
  name: string;
  token: string;
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  expires_at: Date | null;
  last_used_at: Date | null;
  created_by: string | null;
  created_at: Date;
}

// Data Retention Policy types
export interface DataRetentionPolicy {
  id: number;
  project_id: number;
  data_type: 'logs' | 'metrics' | 'events';
  retention_days: number;
  action: 'delete' | 'archive';
  archive_location: string | null;
  enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

// Audit Log types
export interface AuditLog {
  id: number;
  project_id: number | null;
  actor: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

// Ingestion request types
export interface IngestLogRequest {
  level: string;
  message: string;
  context?: Record<string, any>;
  timestamp?: string;
}

export interface IngestMetricRequest {
  name: string;
  type: 'counter' | 'gauge';
  value: number;
  labels?: Record<string, string>;
  timestamp?: string;
}

export interface IngestEventRequest {
  name: string;
  payload?: Record<string, any>;
  timestamp?: string;
}
