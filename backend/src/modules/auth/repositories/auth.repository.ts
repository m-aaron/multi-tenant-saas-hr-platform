import type { PoolClient } from 'pg';

import type { CreateOrganizationInput, CreateEmployeeInput, CreateUserInput, CreateProfileInput } from '../types/repository.type.js';


export async function createOrganization(client: PoolClient, input: CreateOrganizationInput): Promise<string> {
    console.log('Creating organization', input,);
    return crypto.randomUUID();
}

export async function getOwnerRoleId(client: PoolClient, organizationId: string): Promise<string> {
    console.log('Finding owner role', organizationId,);
    return crypto.randomUUID();
}

export async function createEmployee(client: PoolClient, input: CreateEmployeeInput): Promise<string> {
    console.log('Creating employee', input);
    return crypto.randomUUID();
}

export async function createUser(client: PoolClient, input: CreateUserInput): Promise<string> {
    console.log('Creating user', input);
    return crypto.randomUUID();
}

export async function createProfile(client: PoolClient, input: CreateProfileInput): Promise<void> {
    console.log('Creating profile', input);
}