import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

import type { CreateEmployeeInput, UpdateEmployeeInput } from '#modules/employee/schemas/employee.schema.js';
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


// This function finds all active employees in the database for a specific organization.
export async function findEmployeesByOrganizationId(
    client: PoolClient,
    organizationId: string | undefined
): Promise<EmployeeRow[]> {
    
    const query = `
        SELECT 
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
        FROM employees
        WHERE 
            organization_id = $1 
            AND deleted_at IS NULL
        ORDER BY created_at DESC
    `;

    const result = await client.query(query, [organizationId]);

    return result.rows.map(row => ({
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
    }));
}


// This function finds an employee in the database by unique identifier and organization ID, if active.
export async function findEmployeeById(
    client: PoolClient,
    organizationId: string | undefined,
    id: string
): Promise<EmployeeRow | null> {

    const query = `
        SELECT 
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
        FROM employees
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


// This function updates an active employee in the database with non-undefined input fields.
export async function updateEmployee(
    client: PoolClient,
    organizationId: string | undefined,
    id: string,
    input: UpdateEmployeeInput
): Promise<EmployeeRow | null> {

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (input.departmentId !== undefined) {
        setClauses.push(`department_id = $${paramIndex++}`);
        values.push(input.departmentId);
    }
    if (input.firstName !== undefined) {
        setClauses.push(`first_name = $${paramIndex++}`);
        values.push(input.firstName);
    }
    if (input.middleName !== undefined) {
        setClauses.push(`middle_name = $${paramIndex++}`);
        values.push(input.middleName);
    }
    if (input.lastName !== undefined) {
        setClauses.push(`last_name = $${paramIndex++}`);
        values.push(input.lastName);
    }
    if (input.nameExtension !== undefined) {
        setClauses.push(`name_extension = $${paramIndex++}`);
        values.push(input.nameExtension);
    }
    if (input.jobTitle !== undefined) {
        setClauses.push(`job_title = $${paramIndex++}`);
        values.push(input.jobTitle);
    }
    if (input.employmentStatus !== undefined) {
        setClauses.push(`employment_status = $${paramIndex++}`);
        values.push(input.employmentStatus);
    }
    if (input.hireDate !== undefined) {
        setClauses.push(`hire_date = $${paramIndex++}`);
        values.push(input.hireDate);
    }

    if (setClauses.length === 0) {
        return findEmployeeById(client, organizationId, id);
    }

    setClauses.push(`updated_at = NOW()`);

    const idParamIndex = paramIndex++;
    const orgParamIndex = paramIndex++;

    values.push(id, organizationId);

    const query = `
        UPDATE employees
        SET ${setClauses.join(', ')}
        WHERE 
            id = $${idParamIndex}
            AND organization_id = $${orgParamIndex}
            AND deleted_at IS NULL
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

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

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