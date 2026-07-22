import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';
import type { UserRow } from '#modules/user/types/user.type.js';


// This function creates a new user in the database and returns its unique identifier.
export async function createUser(
    client: PoolClient, 
    employeeId: string,
    organizationId: string,
    roleId: string,
    input: { email: string },
    passwordHash: string
): Promise<string> {
    
    const userId = generateUuid();

    const query = `
        INSERT INTO users (
            id, 
            employee_id, 
            organization_id, 
            role_id, 
            email, 
            password_hash
        ) 
        VALUES ($1, $2, $3, $4, $5, $6)
    `;

    const values = [
        userId,
        employeeId,
        organizationId,
        roleId,
        input.email,
        passwordHash
    ];

    await client.query(query, values);

    return userId;
}


// This function finds an active user in the database by its unique identifier and organization ID.
export async function findUserById(
    client: PoolClient,
    organizationId: string,
    id: string
): Promise<UserRow | null> {

    const query = `
        SELECT 
            id,
            employee_id,
            organization_id,
            role_id,
            email,
            status,
            created_at,
            updated_at
        FROM users
        WHERE 
            organization_id = $1 
            AND id = $2 
            AND deleted_at IS NULL
        LIMIT 1
    `;

    const result = await client.query(query, [organizationId, id]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        employeeId: row.employee_id,
        organizationId: row.organization_id,
        roleId: row.role_id,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function finds an active user in the database by email and organization ID.
export async function findUserByEmail(
    client: PoolClient,
    organizationId: string,
    email: string
): Promise<UserRow | null> {

    const query = `
        SELECT 
            id,
            employee_id,
            organization_id,
            role_id,
            email,
            status,
            created_at,
            updated_at
        FROM users
        WHERE 
            organization_id = $1 
            AND email = $2 
            AND deleted_at IS NULL
        LIMIT 1
    `;

    const result = await client.query(query, [organizationId, email]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        employeeId: row.employee_id,
        organizationId: row.organization_id,
        roleId: row.role_id,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function finds an active user in the database by employee ID and organization ID.
export async function findUserByEmployeeId(
    client: PoolClient,
    organizationId: string,
    employeeId: string
): Promise<UserRow | null> {

    const query = `
        SELECT 
            id,
            employee_id,
            organization_id,
            role_id,
            email,
            status,
            created_at,
            updated_at
        FROM users
        WHERE 
            organization_id = $1 
            AND employee_id = $2 
            AND deleted_at IS NULL
        LIMIT 1
    `;

    const result = await client.query(query, [organizationId, employeeId]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        employeeId: row.employee_id,
        organizationId: row.organization_id,
        roleId: row.role_id,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function finds all active users in the database for a specific organization.
export async function findUsersByOrganizationId(
    client: PoolClient,
    organizationId: string
): Promise<UserRow[]> {

    const query = `
        SELECT 
            id,
            employee_id,
            organization_id,
            role_id,
            email,
            status,
            created_at,
            updated_at
        FROM users
        WHERE 
            organization_id = $1 
            AND deleted_at IS NULL
        ORDER BY created_at DESC
    `;

    const result = await client.query(query, [organizationId]);

    return result.rows.map((row) => ({
        id: row.id,
        employeeId: row.employee_id,
        organizationId: row.organization_id,
        roleId: row.role_id,
        email: row.email,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}