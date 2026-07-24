import { withTransaction } from "#databases/transaction.js";

import type { DepartmentRow } from "../types/department.type.js";
import type { 
    CreateDepartmentInput, 
    UpdateDepartmentInput 
} from "../schemas/department.schema.js";

import { ConflictError } from "#shared/errors/conflict-error.js";
import { NotFoundError } from "#shared/errors/not-found-error.js";

import { ActivityLogService } from "#modules/activity/services/activity.service.js";

import { 
    findDepartmentByName, 
    insertDepartment,
    findDepartmentById,
    updateDepartmentName,
    findDepartmentsByOrganizationId,
    clearEmployeesDepartment,
    softDeleteDepartment
} from "../repositories/department.repository.js";


// This service function creates a new department for the user's organization.
export async function createDepartment(
    organizationId: string,
    actorId: string,
    input: CreateDepartmentInput
): Promise<DepartmentRow> {
    
    const result =  await withTransaction(async (client) => {

        // Check if department name already exists in the same organization
        const existing = await findDepartmentByName(client, organizationId, input);
        
        if (existing) {
            throw new ConflictError("Department name already exists in this organization.");
        }

        const department =  await insertDepartment(client, organizationId, input);

        await ActivityLogService.logDepartmentCreated(
            { organizationId, actorId, client },
            { departmentId: department.id, name: department.name }
        );

        return department;
    });

    return result;
}


// This service function updates the department name.
export async function updateDepartment(
    organizationId: string,
    id: string,
    actorId: string,
    input: UpdateDepartmentInput
): Promise<DepartmentRow> {

    const result = await withTransaction(async (client) => {

        // Fetch current department and verify existence and tenant isolation
        const currentDepartment = await findDepartmentById(client, organizationId, id);

        if (!currentDepartment) {
            throw new NotFoundError('Department not found.');
        }

        // Check duplicate name if the name is changing (case-insensitive check)
        if (currentDepartment.name.toLowerCase() !== input.name.toLowerCase()) {

            const existing = await findDepartmentByName(client, organizationId, input);

            if (existing && existing.id !== id) {
                throw new ConflictError('Department name already exists in this organization.');
            }
        }

        const updatedDepartment = await updateDepartmentName(client, id, input);

        if (!updatedDepartment) {
            throw new NotFoundError('Department not found.');
        }

        await ActivityLogService.logDepartmentUpdated(
            { organizationId, actorId, client },
            { departmentId: updatedDepartment.id, name: updatedDepartment.name }
        );

        return updatedDepartment;
    });

    return result;
}


// This service function retrieves all active departments in a user's organization.
export async function getDepartments(
    organizationId: string
): Promise<DepartmentRow[]> {
    
    const result = await withTransaction(async (client) => {
        return await findDepartmentsByOrganizationId(client, organizationId);
    });

    return result;
}


// This service function retrieves a department by its ID.
export async function getDepartmentById(
    organizationId: string,
    id: string
): Promise<DepartmentRow | null> {

    const result = await withTransaction(async (client) => {
        
        const department = await findDepartmentById(client, organizationId, id);

        if (!department) {
            throw new NotFoundError('Department not found.');
        }

        return department;
    });

    return result;
}


// This service function soft deletes a department, first unlinking associated employees.
export async function deleteDepartment(
    organizationId: string,
    id: string,
    actorId: string
): Promise<void> {

    await withTransaction(async (client) => {

        // Fetch current department and verify existence and tenant isolation
        const department = await findDepartmentById(client, organizationId, id);

        if (!department) {
            throw new NotFoundError('Department not found.');
        }

        // Clear department_id for any employees currently in this department
        await clearEmployeesDepartment(client, organizationId, id);

        const deleted = await softDeleteDepartment(client, organizationId, id);

        if (!deleted) {
            throw new NotFoundError('Department not found.');
        }

        await ActivityLogService.logDepartmentArchived(
            { organizationId, actorId, client },
            { departmentId: department.id, name: department.name }
        );
    });
}