import { query } from '../db/client';
import { LogEvent, IngestLogRequest } from '../types';

export async function createLogEvent(
  projectId: number,
  log: IngestLogRequest
): Promise<LogEvent> {
  const timestamp = log.timestamp ? new Date(log.timestamp) : new Date();

  const result = await query<LogEvent>(
    `INSERT INTO log_events (project_id, timestamp, level, message, context_json)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [projectId, timestamp, log.level, log.message, JSON.stringify(log.context || {})]
  );

  return result.rows[0];
}

export async function createLogEventsBatch(
  projectId: number,
  logs: IngestLogRequest[]
): Promise<void> {
  if (logs.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  logs.forEach((log, idx) => {
    const offset = idx * 5;
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`);

    const timestamp = log.timestamp ? new Date(log.timestamp) : new Date();
    values.push(
      projectId,
      timestamp,
      log.level,
      log.message,
      JSON.stringify(log.context || {})
    );
  });

  await query(
    `INSERT INTO log_events (project_id, timestamp, level, message, context_json)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

export interface LogQueryOptions {
  projectId: number;
  level?: string;
  search?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export async function queryLogs(options: LogQueryOptions): Promise<{ logs: LogEvent[], total: number }> {
  const {
    projectId,
    level,
    search,
    startTime,
    endTime,
    limit = 100,
    offset = 0
  } = options;

  const conditions: string[] = ['project_id = $1'];
  const params: any[] = [projectId];
  let paramIndex = 2;

  if (level) {
    conditions.push(`level = $${paramIndex}`);
    params.push(level);
    paramIndex++;
  }

  if (search) {
    conditions.push(`to_tsvector('english', message) @@ plainto_tsquery('english', $${paramIndex})`);
    params.push(search);
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

  // Get total count
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM log_events WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated results
  const logsResult = await query<LogEvent>(
    `SELECT * FROM log_events
     WHERE ${whereClause}
     ORDER BY timestamp DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    logs: logsResult.rows,
    total
  };
}
