import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

import { DEFAULT_ROLES, type RoleName } from '#modules/role/constants/role.constant.js';

// This function seeds default roles for a given organization in the database.
export async function seedDefaultRoles(client: PoolClient, organizationId: string): Promise<void> {
    
    // Build the VALUES clause dynamically
    const values: string[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    DEFAULT_ROLES.forEach((roleName) => {
        const roleId = generateUuid();
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
        values.push(roleId, organizationId, roleName);
        paramIndex += 3;
    });

    const query = `
        INSERT INTO roles (
            id, 
            organization_id, 
            name
        )
        VALUES 
            ${placeholders.join(',\n ')}
        ON CONFLICT (organization_id, name) 
        DO NOTHING
    `;

    await client.query(query, values);
}


// This function finds the ID of a role by its name within a specific organization.
export async function findRoleByName(client: PoolClient, organizationId: string, roleName: RoleName): Promise<string | null> {

    const result = await client.query(
        `SELECT 
            id, 
            organization_id, 
            name
        FROM roles 
        WHERE organization_id = $1 AND name = $2
        LIMIT 1`,
        [organizationId, roleName]
    );

    if (result.rows.length === 0) {
        return null;
    }

    return result.rows[0].id;
}


// This function finds a role by its ID within a specific organization.
export async function findRoleById(client: PoolClient, organizationId: string, roleId: string): Promise<{ id: string; organizationId: string; name: string } | null> {

    const result = await client.query(
        `SELECT 
            id, 
            organization_id, 
            name
        FROM roles 
        WHERE organization_id = $1 AND id = $2
        LIMIT 1`,
        [organizationId, roleId]
    );

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name
    };
}