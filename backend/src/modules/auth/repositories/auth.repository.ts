import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.js';
import type { 
    CreateOrganizationInput, 
    CreateEmployeeInput, 
    CreateUserInput, 
    CreateProfileInput 
} from '../types/repository.type.js';
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
        console.log('Finding owner role', organizationId,);
        return generateUuid();
}

export async function createEmployee(client: PoolClient, input: CreateEmployeeInput): Promise<string> {
        console.log('Creating employee', input);
        return generateUuid();
}

export async function createUser(client: PoolClient, input: CreateUserInput): Promise<string> {
        console.log('Creating user', input);
        return generateUuid();
}

export async function createProfile(client: PoolClient, input: CreateProfileInput): Promise<void> {
        console.log('Creating profile', input);
}