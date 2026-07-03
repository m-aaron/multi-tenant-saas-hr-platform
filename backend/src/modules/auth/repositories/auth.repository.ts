import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.js';
import type { 
    CreateOrganizationInput, 
    CreateEmployeeInput, 
    CreateUserInput, 
    CreateProfileInput 
} from '../types/repository.type.js';
import type { RoleRow } from '#modules/role/types/database.type.js';
import { DEFAULT_ROLES, type RoleName } from '#modules/role/constants/role.constant.js';


export async function createOrganization(client: PoolClient, input: CreateOrganizationInput): Promise<string> {
    const organizationId = generateUuid();

    await client.query(
        'INSERT INTO organizations (id, name, slug) VALUES ($1, $2, $3)',
        [organizationId, input.name, input.slug]
    );

    return organizationId;
}

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

export async function findRoleByName(client: PoolClient, organizationId: string, roleName: RoleName): Promise<string> {
        
    const result = await client.query<RoleRow>(
        `SELECT 
            id, 
            organization_id, 
            name
        FROM roles 
        WHERE organization_id = $1 AND name = $2
        LIMIT 1`,
        [organizationId, roleName]
    );

    if (result.rowCount === 0 || !result.rows[0]) {
        throw new Error(`Role ${roleName} not found.`);
    }

    return result.rows[0].id;
}

export async function createEmployee(client: PoolClient, input: CreateEmployeeInput): Promise<string> {
    
    const employeeId = generateUuid();

    const query = `
        INSERT INTO employees (
            id, 
            organization_id, 
            employee_number, 
            first_name, 
            middle_name, 
            last_name, 
            name_extension, 
            job_title, 
            employment_status, 
            hire_date
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const values = [
        employeeId,
        input.organizationId,
        input.employeeNumber,
        input.firstName,
        input.middleName ?? null,
        input.lastName,
        input.nameExtension ?? null,
        input.jobTitle,
        input.employmentStatus,
        input.hireDate
    ];

    await client.query(query, values);

    return employeeId;
}

export async function createUser(client: PoolClient, input: CreateUserInput): Promise<string> {
    
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
        input.employeeId,
        input.organizationId,
        input.roleId,
        input.email,
        input.passwordHash
    ];

    await client.query(query, values);

    return userId;
}

export async function createProfile(_client: PoolClient, input: CreateProfileInput): Promise<void> {
        console.log('Creating profile', input);
}