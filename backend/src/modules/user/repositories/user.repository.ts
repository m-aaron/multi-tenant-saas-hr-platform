import type { PoolClient } from "pg";

import { generateUuid } from "#shared/utils/uuid.util.js";

import type { CreateUserInput } from "../schemas/user.schema.js";


// This function creates a new user in the database and returns its unique identifier.
export async function createUser(
    client: PoolClient, 
    employeeId: string,
    organizationId: string,
    roleId: string,
    input: CreateUserInput,
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