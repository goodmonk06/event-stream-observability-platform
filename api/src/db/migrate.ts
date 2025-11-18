import * as fs from 'fs';
import * as path from 'path';
import { getPool, closePool } from './client';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  console.log('Running database migrations...');

  const pool = getPool();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(schema);
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw error;
  } finally {
    await closePool();
  }
}

migrate();
