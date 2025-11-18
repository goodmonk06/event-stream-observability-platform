import { query } from '../db/client';
import { MetricPoint, IngestMetricRequest } from '../types';

export async function createMetricPoint(
  projectId: number,
  metric: IngestMetricRequest
): Promise<MetricPoint> {
  const timestamp = metric.timestamp ? new Date(metric.timestamp) : new Date();

  const result = await query<MetricPoint>(
    `INSERT INTO metric_points (project_id, name, type, value, labels_json, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [projectId, metric.name, metric.type, metric.value, JSON.stringify(metric.labels || {}), timestamp]
  );

  return result.rows[0];
}

export async function createMetricPointsBatch(
  projectId: number,
  metrics: IngestMetricRequest[]
): Promise<void> {
  if (metrics.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  metrics.forEach((metric, idx) => {
    const offset = idx * 6;
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`);

    const timestamp = metric.timestamp ? new Date(metric.timestamp) : new Date();
    values.push(
      projectId,
      metric.name,
      metric.type,
      metric.value,
      JSON.stringify(metric.labels || {}),
      timestamp
    );
  });

  await query(
    `INSERT INTO metric_points (project_id, name, type, value, labels_json, timestamp)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

export interface MetricQueryOptions {
  projectId: number;
  name?: string;
  type?: 'counter' | 'gauge';
  startTime?: Date;
  endTime?: Date;
  bucketMinutes?: number;
}

export interface MetricAggregation {
  bucket: Date;
  name: string;
  type: string;
  avg_value: number;
  sum_value: number;
  min_value: number;
  max_value: number;
  count: number;
}

export async function queryMetrics(options: MetricQueryOptions): Promise<MetricPoint[]> {
  const {
    projectId,
    name,
    type,
    startTime,
    endTime
  } = options;

  const conditions: string[] = ['project_id = $1'];
  const params: any[] = [projectId];
  let paramIndex = 2;

  if (name) {
    conditions.push(`name = $${paramIndex}`);
    params.push(name);
    paramIndex++;
  }

  if (type) {
    conditions.push(`type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  if (startTime) {
    conditions.push(`timestamp >= $${paramIndex}`);
    params.push(startTime);
    paramIndex++;
  }

  if (endTime) {
    conditions.push(`timestamp <= $${paramIndex}`);
    params.push(endTime);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  const result = await query<MetricPoint>(
    `SELECT * FROM metric_points
     WHERE ${whereClause}
     ORDER BY timestamp DESC
     LIMIT 1000`,
    params
  );

  return result.rows;
}

export async function aggregateMetrics(options: MetricQueryOptions): Promise<MetricAggregation[]> {
  const {
    projectId,
    name,
    type,
    startTime,
    endTime,
    bucketMinutes = 5
  } = options;

  const conditions: string[] = ['project_id = $1'];
  const params: any[] = [projectId];
  let paramIndex = 2;

  if (name) {
    conditions.push(`name = $${paramIndex}`);
    params.push(name);
    paramIndex++;
  }

  if (type) {
    conditions.push(`type = $${paramIndex}`);
    params.push(type);
    paramIndex++;
  }

  if (startTime) {
    conditions.push(`timestamp >= $${paramIndex}`);
    params.push(startTime);
    paramIndex++;
  }

  if (endTime) {
    conditions.push(`timestamp <= $${paramIndex}`);
    params.push(endTime);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  const result = await query<MetricAggregation>(
    `SELECT
       date_trunc('minute', timestamp) +
       INTERVAL '${bucketMinutes} min' * floor(extract(epoch from timestamp - date_trunc('minute', timestamp)) / (${bucketMinutes} * 60)) as bucket,
       name,
       type,
       AVG(value) as avg_value,
       SUM(value) as sum_value,
       MIN(value) as min_value,
       MAX(value) as max_value,
       COUNT(*) as count
     FROM metric_points
     WHERE ${whereClause}
     GROUP BY bucket, name, type
     ORDER BY bucket DESC`,
    params
  );

  return result.rows;
}
