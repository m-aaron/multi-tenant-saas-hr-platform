import type { PoolClient } from "pg";

import { generateUuid } from "#shared/utils/uuid.util.js";

import type { CreateOrganizationInput } from "../schemas/organization.schema.js";

import type { OrganizationRow } from "../types/organization.type.js";


// This function finds an organization in the database by its name, if active.
export async function findOrganizationByName(
    client: PoolClient,
    name: string
): Promise<OrganizationRow | null> {
    
    const query = `
        SELECT 
            id, 
            name, 
            slug, 
            created_at, 
            updated_at,
            deleted_at
        FROM organizations
        WHERE 
            LOWER(name) = LOWER($1)
        LIMIT 1
    `;

    const result = await client.query(query, [name]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function finds an organization in the database by its slug, if active.
export async function findOrganizationBySlug(
    client: PoolClient,
    slug: string
): Promise<OrganizationRow | null> {
    
    const query = `
        SELECT 
            id, 
            name, 
            slug, 
            created_at, 
            updated_at,
            deleted_at
        FROM organizations
        WHERE 
            LOWER(slug) = LOWER($1)
        LIMIT 1
    `;

    const result = await client.query(query, [slug]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function creates a new organization in the database and returns its unique identifier.
export async function createOrganization(
    client: PoolClient, 
    input: CreateOrganizationInput
): Promise<OrganizationRow> {
    
    const organizationId = generateUuid();

    const query = `
        INSERT INTO organizations (
            id, 
            name, 
            slug
        ) 
        VALUES ($1, $2, $3)
        RETURNING *
    `;

    const values = [
        organizationId,
        input.name,
        input.slug
    ];

    const result = await client.query(query, values);

    const row = result.rows[0];

    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }
}


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