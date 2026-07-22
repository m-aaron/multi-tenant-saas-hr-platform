import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

import type { CreateEmployeeInput } from '#modules/employee/schemas/employee.schema.js';
import type { EmployeeRow } from '#modules/employee/types/employee.type.js';


// This function creates a new employee in the database and returns the created employee record.
export async function createEmployee(
    client: PoolClient,
    organizationId: string,
    employeeNumber: string,
    input: CreateEmployeeInput
): Promise<EmployeeRow> {
    
    const employeeId = generateUuid();

    const query = `
        INSERT INTO employees (
            id, 
            organization_id, 
            department_id,
            employee_number, 
            first_name, 
            middle_name, 
            last_name, 
            name_extension, 
            job_title, 
            employment_status, 
            hire_date
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING 
            id, 
            organization_id, 
            department_id, 
            employee_number, 
            first_name, 
            middle_name, 
            last_name, 
            name_extension, 
            job_title, 
            employment_status, 
            hire_date, 
            created_at, 
            updated_at
    `;

    const values = [
        employeeId,
        organizationId,
        input.departmentId ?? null,
        employeeNumber,
        input.firstName,
        input.middleName ?? null,
        input.lastName,
        input.nameExtension ?? null,
        input.jobTitle,
        input.employmentStatus,
        input.hireDate
    ];

    const result = await client.query(query, values);
    const row = result.rows[0];

    return {
        id: row.id,
        organizationId: row.organization_id,
        departmentId: row.department_id,
        employeeNumber: row.employee_number,
        firstName: row.first_name,
        middleName: row.middle_name,
        lastName: row.last_name,
        nameExtension: row.name_extension,
        jobTitle: row.job_title,
        employmentStatus: row.employment_status,
        hireDate: row.hire_date,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}