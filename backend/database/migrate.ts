// database/migrate.ts
//
// Applies pending SQL migrations in the order declared by database/schema.sql.
// schema.sql is the single source of truth for migration execution order.
// Tracks applied migrations in a schema_migrations table.
//
// Usage:
//   pnpm migrate            → targets DATABASE_NAME from .env  (hr_platform_dev)
//   pnpm migrate:test       → targets DATABASE_NAME from .env.test (hr_platform_test)
//
// Idempotent — already-applied migrations are skipped without error.
// Each migration runs inside its own transaction; a failure rolls back only
// that migration and exits non-zero, leaving prior migrations intact.

import '#configs/env.js'; // must be first — loads .env / .env.test
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { env } from '#configs/env.js';

import { logger } from '#shared/logger/logger.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_DIR = __dirname;
const MIGRATIONS_DIR = path.resolve(DATABASE_DIR, 'migrations');
const SCHEMA_SQL = path.resolve(DATABASE_DIR, 'schema.sql');

// DDL executed once per target database to bootstrap migration tracking.
const CREATE_MIGRATIONS_TABLE_SQL = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
        filename   TEXT        PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
`;

/**
 * Parse migration filenames from schema.sql in declaration order.
 * Each line matching  \i migrations/<filename>.sql  is extracted.
 * This keeps schema.sql as the single source of truth for execution order.
 */
async function parseMigrationOrder(): Promise<string[]> {
    const content = await readFile(SCHEMA_SQL, 'utf8');
    const matches = [...content.matchAll(/\\i\s+migrations\/([\w.]+\.sql)/g)];

    if (matches.length === 0) {
        throw new Error(
            `[migrate] No migration entries found in schema.sql. ` +
            `Expected lines matching: \\i migrations/<filename>.sql`,
        );
    }

    return matches.map((m) => {
        const filename = m[1];
        if (!filename) throw new Error('[migrate] Unexpected empty match in schema.sql');
        return filename;
    });
}

export async function runMigrations(): Promise<void> {
    const orderedFiles = await parseMigrationOrder();

    const pool = new Pool({
        host: env.db.host,
        port: env.db.port,
        database: env.db.name,
        user: env.db.user,
        password: env.db.password,
    });

    const client = await pool.connect();

    try {
        // Ensure tracking table exists before querying it.
        await client.query(CREATE_MIGRATIONS_TABLE_SQL);

        // Fetch the set of already-applied filenames.
        const { rows } = await client.query<{ filename: string }>(
            'SELECT filename FROM schema_migrations ORDER BY filename',
        );
        const applied = new Set(rows.map((r) => r.filename));

        let appliedCount = 0;

        for (const file of orderedFiles) {
            if (applied.has(file)) {
                logger.info(`[migrate] skip    ${file}`);
                continue;
            }

            const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8');

            // Each migration is wrapped in its own transaction so a failure
            // rolls back only that migration without corrupting prior state.
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query(
                    'INSERT INTO schema_migrations (filename) VALUES ($1)',
                    [file],
                );
                await client.query('COMMIT');
                logger.info(`[migrate] applied  ${file}`);
                appliedCount++;
            } catch (err) {
                await client.query('ROLLBACK');
                throw new Error(
                    `[migrate] FAILED   ${file}\n` +
                    `${err instanceof Error ? err.message : String(err)}`,
                );
            }
        }

        logger.info(
            `[migrate] complete — ${appliedCount} applied, ` +
            `${orderedFiles.length - appliedCount} skipped ` +
            `(target: ${env.db.name})`,
        );
    } finally {
        client.release();
        await pool.end();
    }
}

// Entry point when executed directly via pnpm migrate / pnpm migrate:test.
runMigrations().catch((err: unknown) => {
    if (err instanceof Error) {
        logger.error(`[migrate] ${err.message}`);
    } else {
        logger.error('[migrate] Unknown error.');
    }

    process.exit(1);
});
