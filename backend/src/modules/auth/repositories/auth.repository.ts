import type { CreateUserInput } from '../types/auth.type.js';


export async function createOrganization(input: { 
    name: string;
    slug: string;
}): Promise<string> {
    console.log('Creating organization', input,);

    return crypto.randomUUID();
}

export async function getOwnerRoleId(organizationId: string): Promise<string> {
    console.log('Finding owner role', organizationId,);

    return crypto.randomUUID();
}

export async function createUser(input: CreateUserInput): Promise<string> {
    console.log('Creating user', input);

    return crypto.randomUUID();
}

export async function createProfile(input: {
    userId: string;

    firstName: string;
    middleName?: string | undefined;
    lastName: string;
    nameExtension?: string | undefined;
}): Promise<void> {
    console.log('Creating profile', input);
}