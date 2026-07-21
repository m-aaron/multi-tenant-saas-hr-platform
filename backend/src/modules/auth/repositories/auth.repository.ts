import type { PoolClient } from 'pg';

import type {
    FindLoginUserInput,
    UserLoginRow,
    AuthenticatedUserRecord
} from '../types/auth.type.js';


// This function finds a user in the database based on the provided organization slug and email.
export async function findUserForLogin(client: PoolClient, input: FindLoginUserInput): Promise<UserLoginRow | null> {

    const query = `
        SELECT
            u.id,
            u.employee_id,
            u.organization_id,
            u.role_id,
            u.email,
            u.password_hash,
            u.status
        FROM users u
        INNER JOIN organizations o
            ON o.id = u.organization_id
        WHERE
            o.slug = $1
            AND u.email = $2
        LIMIT 1;
    `;

    const values = [input.organizationSlug, input.email];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    const userRow = result.rows[0];

    return {
        id: userRow.id,
        employeeId: userRow.employee_id,
        organizationId: userRow.organization_id,
        roleId: userRow.role_id,
        email: userRow.email,
        passwordHash: userRow.password_hash,
        status: userRow.status
    };
}


// This function revokes a specific session in the database by setting its revoked_at timestamp.
export async function revokeSession(client: PoolClient, sessionId: string): Promise<void> {
    
    const query = `
        UPDATE sessions
        SET 
            revoked_at = NOW()
        WHERE id = $1 AND revoked_at IS NULL
    `;

    await client.query(query, [sessionId]);
}


// This function revokes all active sessions for a specific user in the database.
export async function revokeAllSessions(client: PoolClient, userId: string | undefined): Promise<number | null> {
    
    const query = `
        UPDATE sessions
        SET 
            revoked_at = NOW()
        WHERE 
            user_id = $1 
            AND revoked_at IS NULL 
            AND expires_at > NOW()
    `;

    const result = await client.query(query, [userId]);

    return result.rowCount; // Return the number of sessions revoked
}


// This function finds an authenticated user in the database by their unique identifier.
export async function findAuthenticatedUserById(client: PoolClient, userId: string): Promise<AuthenticatedUserRecord | null> {
    
    const query = `
        SELECT 
            u.id,
            u.organization_id,
            o.deleted_at AS organization_deleted_at,
            u.employee_id,
            u.role_id,
            r.name AS role_name,
            u.email,
            u.status,
            u.deleted_at AS user_deleted_at
        FROM users u
        INNER JOIN organizations o ON u.organization_id = o.id
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.id = $1
        LIMIT 1;
    `;

    const result = await client.query(query, [userId]);

    if (result.rows.length === 0) {
        return null;
    }

    const userRow = result.rows[0];

    return {    
        id: userRow.id,
        organizationId: userRow.organization_id,
        organizationDeletedAt: userRow.organization_deleted_at ? new Date(userRow.organization_deleted_at) : null,
        employeeId: userRow.employee_id,
        roleId: userRow.role_id,
        roleName: userRow.role_name,
        email: userRow.email,
        status: userRow.status,
        userDeletedAt: userRow.user_deleted_at ? new Date(userRow.user_deleted_at) : null
    };
}