import { query } from '../db/client';
import { CustomEvent, IngestEventRequest } from '../types';

export async function createCustomEvent(
  projectId: number,
  event: IngestEventRequest
): Promise<CustomEvent> {
  const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();

  const result = await query<CustomEvent>(
    `INSERT INTO custom_events (project_id, name, payload_json, timestamp)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [projectId, event.name, JSON.stringify(event.payload || {}), timestamp]
  );

  return result.rows[0];
}

export async function createCustomEventsBatch(
  projectId: number,
  events: IngestEventRequest[]
): Promise<void> {
  if (events.length === 0) return;

  const values: any[] = [];
  const placeholders: string[] = [];

  events.forEach((event, idx) => {
    const offset = idx * 4;
    placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4})`);

    const timestamp = event.timestamp ? new Date(event.timestamp) : new Date();
    values.push(
      projectId,
      event.name,
      JSON.stringify(event.payload || {}),
      timestamp
    );
  });

  await query(
    `INSERT INTO custom_events (project_id, name, payload_json, timestamp)
     VALUES ${placeholders.join(', ')}`,
    values
  );
}

export interface EventQueryOptions {
  projectId: number;
  name?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export async function queryEvents(options: EventQueryOptions): Promise<{ events: CustomEvent[], total: number }> {
  const {
    projectId,
    name,
    startTime,
    endTime,
    limit = 100,
    offset = 0
  } = options;

  const conditions: string[] = ['project_id = $1'];
  const params: any[] = [projectId];
  let paramIndex = 2;

  if (name) {
    conditions.push(`name = $${paramIndex}`);
    params.push(name);
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
    `SELECT COUNT(*) as count FROM custom_events WHERE ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Get paginated results
  const eventsResult = await query<CustomEvent>(
    `SELECT * FROM custom_events
     WHERE ${whereClause}
     ORDER BY timestamp DESC
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return {
    events: eventsResult.rows,
    total
  };
}
