import { type PoolClient } from "pg";

import type { CreateSessionInput } from "../types/session.type.js";

import type { 
    RefreshSession, 
    UpdateSessionRefreshTokenInput
} from "../types/session.type.js";

export async function createSession(client: PoolClient, input: CreateSessionInput): Promise<void> {

    const query = `
        INSERT INTO sessions (
            id,
            organization_id,
            user_id, 
            refresh_token_hash,
            expires_at
        ) 
        VALUES ($1, $2, $3, $4, $5)
    `;

    const values = [
        input.id,
        input.organizationId,
        input.userId,
        input.refreshTokenHash,
        input.expiresAt
    ]

    await client.query(query, values);
}

export async function findSessionById(client: PoolClient, sessionId: string): Promise<RefreshSession | null> {

    const query = `
        SELECT 
            id,
            organization_id,
            user_id,
            refresh_token_hash,
            expires_at,
            revoked_at
        FROM sessions
        WHERE id = $1
        LIMIT 1
    `;

    const result = await client.query(query, [sessionId]);

    if (result.rowCount === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        organizationId: row.organization_id,
        userId: row.user_id,
        refreshTokenHash: row.refresh_token_hash,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at
    };
}


export async function updateSessionRefreshToken(client: PoolClient, input: UpdateSessionRefreshTokenInput): Promise<void> {
    
    const query = `
        UPDATE sessions
        SET 
            refresh_token_hash = $1, 
            expires_at = $2, 
            last_used_at = $3
        WHERE id = $4
    `;

    const values = [
        input.refreshTokenHash,
        input.expiresAt,
        input.lastUsedAt,
        input.sessionId
    ];

    await client.query(query, values);
}