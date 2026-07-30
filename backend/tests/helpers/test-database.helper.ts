import { testPool } from '#tests/setup.js';


export interface SessionRow {
    id: string;
    refresh_token_hash: string;
    expires_at: Date;
    revoked_at: Date | null;
    last_used_at: Date | null;
}

export interface AuditLogRow {
    action: string;
    actor_id: string;
    entity: string;
}

export interface ActivityLogRow {
    actor_id: string | null;
    event_type: string;
}


export async function cleanupOrg(slug: string): Promise<void> {
    const client = await testPool.connect();

    try {
        const orgResult = await client.query<{ id: string }>(
            'SELECT id FROM organizations WHERE slug = $1',
            [slug],
        );

        if (orgResult.rows.length === 0) return;

        const id = orgResult.rows[0]!.id;

        await client.query('DELETE FROM activity_logs WHERE organization_id = $1', [id]);
        await client.query('DELETE FROM audit_logs WHERE organization_id = $1', [id]);
        await client.query('DELETE FROM users WHERE organization_id = $1', [id]); // cascades: profiles, sessions
        await client.query('DELETE FROM employees WHERE organization_id = $1', [id]);
        await client.query('DELETE FROM departments WHERE organization_id = $1', [id]);
        await client.query('DELETE FROM roles WHERE organization_id = $1', [id]);
        await client.query('DELETE FROM organizations WHERE id = $1', [id]);
    } finally {
        client.release();
    }
}


export async function getOrgId(slug: string): Promise<string> {
    const result = await testPool.query<{ id: string }>(
        'SELECT id FROM organizations WHERE slug = $1',
        [slug],
    );
    if (result.rows.length === 0) {
        throw new Error(`[db-helper] No org found for slug: ${slug}`);
    }
    return result.rows[0]!.id;
}


export async function getUserId(orgId: string): Promise<string> {
    const result = await testPool.query<{ id: string }>(
        'SELECT id FROM users WHERE organization_id = $1',
        [orgId],
    );
    if (result.rows.length === 0) {
        throw new Error(`[db-helper] No user found for org: ${orgId}`);
    }
    return result.rows[0]!.id;
}


export async function getLatestSession(userId: string): Promise<SessionRow> {
    const result = await testPool.query<SessionRow>(
        `
            SELECT 
                id, 
                refresh_token_hash, 
                expires_at, 
                last_used_at, 
                revoked_at
            FROM sessions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        `,
        [userId],
    );
    if (result.rows.length === 0) {
        throw new Error(`[db-helper] No session found for user: ${userId}`);
    }
    return result.rows[0]!;
}


export async function getSession(sessionId: string): Promise<SessionRow> {
    const result = await testPool.query<SessionRow>(
        `
            SELECT 
                id, 
                refresh_token_hash, 
                expires_at, 
                last_used_at, 
                revoked_at
            FROM sessions
            WHERE id = $1
        `,
        [sessionId],
    );
    if (result.rows.length === 0) {
        throw new Error(`[db-helper] No session found: ${sessionId}`);
    }
    return result.rows[0]!;
}


export async function getLatestActivityLog(
    orgId: string,
    eventType: string,
): Promise<ActivityLogRow | undefined> {
    const result = await testPool.query<ActivityLogRow>(
        `
            SELECT 
                actor_id,
                event_type
            FROM activity_logs
            WHERE 
                organization_id = $1 
                AND event_type = $2
            ORDER BY created_at DESC
            LIMIT 1
        `,
        [orgId, eventType],
    );
    return result.rows[0];
}



export async function getLatestAuditLog(
    orgId: string,
    action: string,
): Promise<AuditLogRow | undefined> {
    const result = await testPool.query<AuditLogRow>(
        `
            SELECT 
                actor_id,
                action,
                entity
            FROM audit_logs
            WHERE 
                organization_id = $1 
                AND action = $2
            ORDER BY created_at DESC
            LIMIT 1
        `,
        [orgId, action],
    );
    return result.rows[0];
}


export async function countAuditLogs(orgId: string, action: string): Promise<number> {
    const result = await testPool.query<{ count: string }>(
        `
            SELECT 
                COUNT(*) AS count
            FROM audit_logs
            WHERE 
                organization_id = $1 
                AND action = $2
        `,
        [orgId, action],
    );
    return Number(result.rows[0]!.count);
}
