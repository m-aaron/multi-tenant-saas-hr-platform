import { Pool } from 'pg';

import { env } from '#configs/env.js';

export const db = new Pool({
    ...('url' in env.db ?
        {
            connectionString: env.db.url,
            ...(env.NODE_ENV === 'production' ? { ssl: { rejectUnauthorized: false } } : {}),
        } : {
            host: env.db.host,
            port: env.db.port,
            database: env.db.name,
            user: env.db.user,
            password: env.db.password
        }),
    max: 10,
    idleTimeoutMillis: 30_000,
});