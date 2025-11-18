import { Pool, PoolClient, QueryResult } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
