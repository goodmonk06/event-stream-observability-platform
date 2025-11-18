import { query } from '../db/client';
import { Project } from '../types';
import { nanoid } from 'nanoid';

export async function createProject(name: string): Promise<Project> {
  const apiKey = `obs_${nanoid(48)}`;

  const result = await query<Project>(
    'INSERT INTO projects (name, api_key) VALUES ($1, $2) RETURNING *',
    [name, apiKey]
  );

  return result.rows[0];
}

export async function getProjectByApiKey(apiKey: string): Promise<Project | null> {
  const result = await query<Project>(
    'SELECT * FROM projects WHERE api_key = $1',
    [apiKey]
  );

  return result.rows[0] || null;
}

export async function getProjectById(id: number): Promise<Project | null> {
  const result = await query<Project>(
    'SELECT * FROM projects WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

export async function listProjects(): Promise<Project[]> {
  const result = await query<Project>(
    'SELECT * FROM projects ORDER BY created_at DESC'
  );

  return result.rows;
}

export async function deleteProject(id: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM projects WHERE id = $1',
    [id]
  );

  return (result.rowCount || 0) > 0;
}
