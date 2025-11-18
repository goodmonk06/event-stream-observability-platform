export interface Project {
  id: number;
  name: string;
  api_key: string;
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
