// database/create-db.ts
//
// Creates hr_platform_test if it does not exist.
// Connects to the "postgres" maintenance database so that CREATE DATABASE
// is always valid — you cannot CREATE DATABASE while connected to it.
//
// Usage:
//   pnpm db:create:test
//
// Safe to run multiple times — exits 0 if the database already exists.

import '#configs/env.js'; // must be first — loads .env.test when NODE_ENV=test
import { Client } from 'pg';
import { env } from '#configs/env.js';
import { logger } from '#shared/logger/logger.js';

const TARGET_DB = 'hr_platform_test';

async function createTestDatabase(): Promise<void> {
    // Always connect to the postgres maintenance DB, never to the target DB.
    const client = new Client({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: 'postgres',
    });

    await client.connect();

    try {
        // Check existence before attempting CREATE — avoids a noisy PG error.
        const result = await client.query<{ datname: string }>(
            'SELECT datname FROM pg_database WHERE datname = $1',
            [TARGET_DB],
        );

        if ((result.rowCount ?? 0) > 0) {
            logger.info(`[db:create] "${TARGET_DB}" already exists — nothing to do.`);
            return;
        }

        // Database identifiers cannot be parameterised. TARGET_DB is a
        // compile-time constant defined above — not user input.
        await client.query(`CREATE DATABASE "${TARGET_DB}"`);
        logger.info(`[db:create] "${TARGET_DB}" created successfully.`);
    } finally {
        await client.end();
    }
}

createTestDatabase().catch((err: unknown) => {
    if (err instanceof Error) {
        logger.error(`[db:create] ${err.message}`);
    } else {
        logger.error('[db:create] Unknown error.');
    }

    process.exit(1);
});