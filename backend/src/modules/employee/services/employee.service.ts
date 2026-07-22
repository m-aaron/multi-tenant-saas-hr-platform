import { withTransaction } from '#databases/transaction.js';

import type { EmployeeRow } from '#modules/employee/types/employee.type.js';
import type { CreateEmployeeInput } from '#modules/employee/schemas/employee.schema.js';

import { 
    createEmployee as insertEmployee,
    findEmployeesByOrganizationId,
    findEmployeeById
} from '#modules/employee/repositories/employee.repository.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { findDepartmentById } from '#modules/department/repositories/department.repository.js';

import { NotFoundError } from '#shared/errors/not-found-error.js';
import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';


// This service function creates a new employee in the authenticated user's organization.
export async function createEmployee(
    organizationId: string | undefined,
    input: CreateEmployeeInput
): Promise<EmployeeRow> {

    if (!organizationId) {
        throw new UnauthorizedError('Organization context missing.');
    }

    const result = await withTransaction(async (client) => {

        if (input.departmentId) {
            const department = await findDepartmentById(client, organizationId, input.departmentId);

            if (!department) {
                throw new NotFoundError('Department not found.');
            }
        }

        const employeeNumber = await generateEmployeeNumber(client, organizationId);

        const employee = await insertEmployee(client, organizationId, employeeNumber, input);

        return employee;
    });

    return result;
}


// This service function retrieves all active employees in a user's organization.
export async function getEmployees(
    organizationId: string | undefined
): Promise<EmployeeRow[]> {

    if (!organizationId) {
        return [];
    }

    const result = await withTransaction(async (client) => {
        return await findEmployeesByOrganizationId(client, organizationId);
    });

    return result;
}


// This service function retrieves an employee by ID.
export async function getEmployeeById(
    organizationId: string | undefined,
    id: string
): Promise<EmployeeRow | null> {

    if (!organizationId) {
        return null;
    }

    const result = await withTransaction(async (client) => {

        const employee = await findEmployeeById(client, organizationId, id);

        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }

        return employee;
    });

    return result;
}
