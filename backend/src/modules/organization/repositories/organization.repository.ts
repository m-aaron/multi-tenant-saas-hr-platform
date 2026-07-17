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
        updatedAt: row.created_at,
        revokedAt: row.deleted_at
    }
}