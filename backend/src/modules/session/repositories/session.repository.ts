import { type PoolClient } from "pg";

import type { CreateSessionInput } from "../types/session.type.js";

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