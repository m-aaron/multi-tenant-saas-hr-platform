import { type PoolClient } from "pg";

import { generateUuid } from "#shared/utils/uuid.js";

import type { CreateSessionInput } from "../types/session.type.js";

export async function createSession(client: PoolClient, input: CreateSessionInput): Promise<string> {
    
    const sessionId = generateUuid();

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
        sessionId,
        input.organizationId,
        input.userId,
        input.refreshTokenHash,
        input.expiresAt
    ]

    await client.query(query, values);

    return sessionId;
}