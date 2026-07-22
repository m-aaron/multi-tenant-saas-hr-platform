import type { PoolClient } from "pg";

import { generateUuid } from "#shared/utils/uuid.util.js";

import type { DepartmentRow } from "../types/department.type.js";
import type { 
    CreateDepartmentInput, 
    UpdateDepartmentInput
} from "../schemas/department.schema.js";


// This function finds a department in the database by its name and organization ID, if active.
export async function findDepartmentByName(
    client: PoolClient,
    organizationId: string,
    input: CreateDepartmentInput
): Promise<DepartmentRow | null> {
    
    const query = `
        SELECT 
            id, 
            organization_id, 
            name, 
            created_at, 
            updated_at
        FROM departments
        WHERE 
            organization_id = $1 
            AND LOWER(name) = LOWER($2)
            AND deleted_at IS NULL
        LIMIT 1
    `;

    const values = [
        organizationId,
        input.name
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function inserts a new department in the database.
export async function insertDepartment(
    client: PoolClient,
    organizationId: string | undefined,
    input: CreateDepartmentInput
): Promise<DepartmentRow> {
    
    const departmentId = generateUuid();

    const query = `
        INSERT INTO departments (
            id, 
            organization_id, 
            name
        )
        VALUES ($1, $2, $3)
        RETURNING 
            id, 
            organization_id, 
            name, 
            created_at, 
            updated_at
    `;

    const values = [
        departmentId,
        organizationId,
        input.name
    ];

    const result = await client.query(query, values);

    const row = result.rows[0];

    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function finds a department in the database by its unique identifier and organization ID, if active.
export async function findDepartmentById(
    client: PoolClient,
    organizationId: string,
    id: string
): Promise<DepartmentRow | null> {
    
    const query = `
        SELECT 
            id, 
            organization_id, 
            name, 
            created_at, 
            updated_at
        FROM departments
        WHERE 
            id = $1 
            AND organization_id = $2
            AND deleted_at IS NULL
        LIMIT 1
    `;

    const values = [
        id,
        organizationId
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function updates the name of an existing active department in the database.
export async function updateDepartmentName(
    client: PoolClient,
    id: string,
    input: UpdateDepartmentInput
): Promise<DepartmentRow | null> {
    
    const query = `
        UPDATE departments
        SET 
            name = $1,
            updated_at = NOW()
        WHERE 
            id = $2
            AND deleted_at IS NULL
        RETURNING 
            id, 
            organization_id, 
            name, 
            created_at, 
            updated_at
    `;

    const values = [
        input.name,
        id
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];

    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}


// This function finds all active departments in the database for a specific organization.
export async function findDepartmentsByOrganizationId(
    client: PoolClient,
    organizationId: string
): Promise<DepartmentRow[]> {
    
    const query = `
        SELECT 
            id, 
            organization_id, 
            name, 
            created_at, 
            updated_at
        FROM departments
        WHERE 
            organization_id = $1 
            AND deleted_at IS NULL
        ORDER BY name ASC
    `;

    const result = await client.query(query, [organizationId]);

    return result.rows.map(row => ({
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    }));
}


// This function clears the department association for all employees in a given department.
export async function clearEmployeesDepartment(
    client: PoolClient,
    organizationId: string,
    departmentId: string
): Promise<void> {
    
    const query = `
        UPDATE employees
        SET 
            department_id = NULL,
            updated_at = NOW()
        WHERE 
            department_id = $1 
            AND organization_id = $2
            AND deleted_at IS NULL
    `;

    await client.query(query, [departmentId, organizationId]);
}


// This function soft deletes a department by setting its deleted_at column to NOW().
export async function softDeleteDepartment(
    client: PoolClient,
    organizationId: string,
    id: string
): Promise<boolean> {
    
    const query = `
        UPDATE departments
        SET 
            deleted_at = NOW(),
            updated_at = NOW()
        WHERE 
            id = $1 
            AND organization_id = $2
            AND deleted_at IS NULL
        RETURNING id
    `;

    const result = await client.query(query, [id, organizationId]);

    return result.rows.length > 0;
}



