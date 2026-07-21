import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

import type { CreateEmployeeInput } from '#modules/employee/schemas/employee.schema.js';


// This function creates a new employee in the database and returns its unique identifier.
export async function createEmployee(
    client: PoolClient, 
    organizationId: string,
    employeeNumber: string,
    input: CreateEmployeeInput
): Promise<string> {
    
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
        organizationId,
        employeeNumber,
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