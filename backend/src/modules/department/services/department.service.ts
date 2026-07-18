import { withTransaction } from "#databases/transaction.js";

import type { DepartmentRow } from "../types/department.type.js";
import type { 
    CreateDepartmentInput, 
    UpdateDepartmentInput 
} from "../schemas/department.schema.js";

import { ConflictError } from "#shared/errors/conflict-error.js";
import { NotFoundError } from "#shared/errors/not-found-error.js";

import { 
    findDepartmentByName, 
    insertDepartment,
    findDepartmentById,
    updateDepartmentName
} from "../repositories/department.repository.js";


// This service function creates a new department for the user's organization.
export async function createDepartment(
    organizationId: string | undefined,
    input: CreateDepartmentInput
): Promise<DepartmentRow> {
    
    const result =  await withTransaction(async (client) => {

        // Check if department name already exists in the same organization
        const existing = await findDepartmentByName(client, organizationId, input);
        
        if (existing) {
            throw new ConflictError("Department name already exists in this organization.");
        }

        const department =  await insertDepartment(client, organizationId, input);

        return {
            id: department.id,
            organizationId: department.organizationId,
            name: department.name,
            createdAt: department.createdAt,
            updatedAt: department.updatedAt
        };
    });

    return result;
}


// This service function updates the department name.
export async function updateDepartment(
    organizationId: string | undefined,
    id: string,
    input: UpdateDepartmentInput
): Promise<DepartmentRow> {

    const result = await withTransaction(async (client) => {

        // Fetch current department and verify existence and tenant isolation
        const current = await findDepartmentById(client, organizationId, id);

        if (!current) {
            throw new NotFoundError('Department not found.');
        }

        // Check duplicate name if the name is changing (case-insensitive check)
        if (current.name.toLowerCase() !== input.name.toLowerCase()) {

            const existing = await findDepartmentByName(client, organizationId, input);

            if (existing && existing.id !== id) {
                throw new ConflictError('Department name already exists in this organization.');
            }
        }

        const updated = await updateDepartmentName(client, id, input);

        if (!updated) {
            throw new NotFoundError('Department not found.');
        }

        return {
            id: updated.id,
            organizationId: updated.organizationId,
            name: updated.name,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt
        };
    });

    return result;
}
