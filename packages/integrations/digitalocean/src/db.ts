import { Pool, QueryResultRow } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables by searching upwards for .env
let currentDir = process.cwd();
let envLoaded = false;
while (currentDir) {
  const envPath = path.join(currentDir, '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    envLoaded = true;
    break;
  }
  const parent = path.dirname(currentDir);
  if (parent === currentDir) break;
  currentDir = parent;
}

if (!envLoaded) {
  try {
    dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  } catch (e) {}
}

// Bypasses self-signed certificate errors for DigitalOcean Postgres connections
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not defined');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export async function executeQuery<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query<T>(text, params);
    return res.rows;
  } finally {
    client.release();
  }
}

export async function executeInsert(text: string, params?: any[]): Promise<any> {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    if (res.rows && res.rows.length > 0) {
      const firstRow = res.rows[0];
      return Object.values(firstRow)[0];
    }
    return null;
  } finally {
    client.release();
  }
}
