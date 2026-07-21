import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

// This function creates a new profile in the database for a given user.
export async function createProfile(
    client: PoolClient, 
    userId: string
): Promise<void> {
    
    const profileId = generateUuid();

    const query = `
        INSERT INTO profiles (
            id, 
            user_id
        ) 
        VALUES ($1, $2)
    `;

    const values = [
        profileId,
        userId
    ];

    await client.query(query, values);
}