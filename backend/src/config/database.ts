import { Pool } from 'pg';
import { logger } from '../utils/logger';

let poolInstance: Pool | null = null;

export function createPool(): Pool {
  const DATABASE_HOST = process.env.DATABASE_HOST;
  const DATABASE_PORT = process.env.DATABASE_PORT;
  const DATABASE_NAME = process.env.DATABASE_NAME;
  const DATABASE_USER = process.env.DATABASE_USER;
  const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;

  if (DATABASE_HOST === undefined) {
    throw new Error('Missing required database environment variable: DATABASE_HOST');
  }

  if (DATABASE_PORT === undefined) {
    throw new Error('Missing required database environment variable: DATABASE_PORT');
  }

  if (DATABASE_NAME === undefined) {
    throw new Error('Missing required database environment variable: DATABASE_NAME');
  }

  if (DATABASE_USER === undefined) {
    throw new Error('Missing required database environment variable: DATABASE_USER');
  }

  if (DATABASE_PASSWORD === undefined) {
    throw new Error('Missing required database environment variable: DATABASE_PASSWORD');
  }

  const pool = new Pool({
    host: DATABASE_HOST,
    port: parseInt(DATABASE_PORT, 10),
    database: DATABASE_NAME,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    logger.error('Unexpected database error', err);
  });

  return pool;
}

export function getPool(): Pool {
  if (poolInstance === null) {
    poolInstance = createPool();
  }
  return poolInstance;
}