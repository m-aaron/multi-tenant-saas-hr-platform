// tests/setup.ts
//
// Vitest global setup file — runs before and after the entire test suite.
//
// Responsibilities:
//   beforeAll — open a pg Pool connection to hr_platform_test and verify it.
//   afterAll  — drain and close the pool so no open handles are left behind.
//
// Migrations are NOT run here. Run `pnpm migrate:test` once before testing.

import { afterAll, beforeAll } from 'vitest';
import { Pool } from 'pg';
import { env } from '#configs/env.js';
import { logger } from '#shared/logger/logger.js';

// Exported so individual test files can import the pool if they need direct
// database access (e.g., to seed / clean up fixture data).
export let testPool: Pool;

beforeAll(async () => {
    testPool = new Pool({
        host: env.db.host,
        port: env.db.port,
        database: env.db.name, // hr_platform_test (set by .env.test via cross-env)
        user: env.db.user,
        password: env.db.password,
    });

    // Verify the connection immediately — fail fast if the test DB is not ready.
    const client = await testPool.connect();
    client.release();

    logger.info(`[test:setup] Connected to: ${env.db.name}`);
});

afterAll(async () => {
    await testPool.end();
    logger.info('[test:setup] Connection pool closed.');
});
