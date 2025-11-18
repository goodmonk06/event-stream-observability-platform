const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Project {
  id: number;
  name: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export interface LogEvent {
  id: number;
  project_id: number;
  timestamp: string;
  level: string;
  message: string;
  context_json?: Record<string, any>;
  created_at: string;
}

export interface MetricAggregation {
  bucket: string;
  name: string;
  type: string;
  avg_value: number;
  sum_value: number;
  min_value: number;
  max_value: number;
  count: number;
}

export interface CustomEvent {
  id: number;
  project_id: number;
  name: string;
  payload_json?: Record<string, any>;
  timestamp: string;
  created_at: string;
}

// Projects
export async function getProjects(): Promise<Project[]> {
  const res = await fetch(`${API_URL}/projects`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch projects');
  const data = await res.json();
  return data.projects;
}

export async function getProject(id: number): Promise<Project> {
  const res = await fetch(`${API_URL}/projects/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch project');
  return res.json();
}

export async function createProject(name: string): Promise<Project> {
  const res = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

// Logs
export async function getLogs(params: {
  projectId: number;
  level?: string;
  search?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: LogEvent[]; total: number }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API_URL}/query/logs?${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

// Metrics
export async function getMetricsAggregated(params: {
  projectId: number;
  name?: string;
  type?: string;
  startTime?: string;
  endTime?: string;
  bucketMinutes?: number;
}): Promise<MetricAggregation[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API_URL}/query/metrics/aggregate?${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  const data = await res.json();
  return data.aggregations;
}

// Events
export async function getEvents(params: {
  projectId: number;
  name?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}): Promise<{ events: CustomEvent[]; total: number }> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });

  const res = await fetch(`${API_URL}/query/events?${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}
