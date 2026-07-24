import { withTransaction } from '#databases/transaction.js';

import type { EmployeeRow } from '#modules/employee/types/employee.type.js';
import type { CreateEmployeeInput, UpdateEmployeeInput } from '#modules/employee/schemas/employee.schema.js';

import { ActivityLogService } from "#modules/activity/services/activity.service.js";

import { 
    createEmployee as insertEmployee,
    findEmployeesByOrganizationId,
    findEmployeeById,
    updateEmployee as updateEmployeeRepository,
    softDeleteEmployee
} from '#modules/employee/repositories/employee.repository.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { findDepartmentById } from '#modules/department/repositories/department.repository.js';

import { NotFoundError } from '#shared/errors/not-found-error.js';


// This service function creates a new employee in the authenticated user's organization.
export async function createEmployee(
    organizationId: string,
    actorId: string,
    input: CreateEmployeeInput
): Promise<EmployeeRow> {

    const result = await withTransaction(async (client) => {

        if (input.departmentId) {
            const department = await findDepartmentById(client, organizationId, input.departmentId);

            if (!department) {
                throw new NotFoundError('Department not found.');
            }
        }

        const employeeNumber = await generateEmployeeNumber(client, organizationId);

        const employee = await insertEmployee(client, organizationId, employeeNumber, input);

        await ActivityLogService.logEmployeeCreated(
            { organizationId, actorId, client },
            { 
                employeeId: employee.id,
                employeeNumber: employee.employeeNumber,
                firstName: employee.firstName,
                lastName: employee.lastName
            }
        );

        return employee;
    });

    return result;
}


// This service function retrieves all active employees in a user's organization.
export async function getEmployees(
    organizationId: string
): Promise<EmployeeRow[]> {

    const result = await withTransaction(async (client) => {
        return await findEmployeesByOrganizationId(client, organizationId);
    });

    return result;
}


// This service function retrieves an employee by ID.
export async function getEmployeeById(
    organizationId: string,
    id: string
): Promise<EmployeeRow | null> {

    const result = await withTransaction(async (client) => {

        const employee = await findEmployeeById(client, organizationId, id);

        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }

        return employee;
    });

    return result;
}


// This service function updates an employee's details.
export async function updateEmployee(
    organizationId: string,
    id: string,
    actorId: string,
    input: UpdateEmployeeInput
): Promise<EmployeeRow> {

    const result = await withTransaction(async (client) => {

        const currentEmployee = await findEmployeeById(client, organizationId, id);

        if (!currentEmployee) {
            throw new NotFoundError('Employee not found.');
        }

        if (input.departmentId) {
            const department = await findDepartmentById(client, organizationId, input.departmentId);

            if (!department) {
                throw new NotFoundError('Department not found.');
            }
        }

        const updatedEmployee = await updateEmployeeRepository(client, organizationId, id, input);

        if (!updatedEmployee) {
            throw new NotFoundError('Employee not found.');
        }

        await ActivityLogService.logEmployeeUpdated(
            { organizationId, actorId, client },
            { employeeId: updatedEmployee.id }
        );

        return updatedEmployee;
    });

    return result;
}


// This service function soft deletes an employee.
export async function deleteEmployee(
    organizationId: string,
    id: string,
    actorId: string
): Promise<void> {

    await withTransaction(async (client) => {

        const employee = await findEmployeeById(client, organizationId, id);

        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }

        const deleted = await softDeleteEmployee(client, organizationId, id);

        if (!deleted) {
            throw new NotFoundError('Employee not found.');
        }

        await ActivityLogService.logEmployeeArchived(
            { organizationId, actorId, client },
            { employeeId: employee.id }
        );
    });
}

