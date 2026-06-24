import { Pool } from 'pg';

const getEnv = (primary: string, fallback?: string) =>
  process.env[primary] ?? (fallback ? process.env[fallback] : undefined);

const host = getEnv('DATABASE_HOST', 'DB_HOST') ?? 'localhost';
const port = Number(getEnv('DATABASE_PORT', 'DB_PORT') ?? '5434');
const databaseName = getEnv('DATABASE_NAME', 'DB_NAME') ?? 'hr_platform_dev';
const user = getEnv('DATABASE_USER', 'DB_USER') ?? 'postgres';
const password = getEnv('DATABASE_PASSWORD', 'DB_PASSWORD') ?? 'postgres';

const database = new Pool({
  host,
  port,
  database: databaseName,
  user,
  password,
});

export default database;