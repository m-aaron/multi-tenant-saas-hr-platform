import type { PoolClient } from "pg";

import type { OrganizationRow } from "../types/organization.type.js";


// This function finds an organization in the database by their unique identifier.
export async function findOrganizationById(
    client: PoolClient, 
    organizationId: string | undefined
): Promise<OrganizationRow | null> {

    const query = `
        SELECT *
        FROM organizations
        WHERE id = $1
        LIMIT 1
    `;

    const result = await client.query(query, [organizationId]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        revokedAt: row.deleted_at
    }
}


// This function updates an organization in the database by their unique identifier.
export async function updateOrganizationById(
    client: PoolClient, 
    organizationName: string,
    organizationId: string | undefined
): Promise<OrganizationRow | null> {

    const query = `
        UPDATE organizations
        SET
            name = $1,
            updated_at = NOW()
        WHERE 
            id = $2
            AND deleted_at IS NULL
        RETURNING *
    `;

    const values = [
        organizationName,
        organizationId
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        revokedAt: row.deleted_at
    }
}