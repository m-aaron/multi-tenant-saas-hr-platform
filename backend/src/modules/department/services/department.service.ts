import { withTransaction } from "#databases/transaction.js";

import type { DepartmentRow } from "../types/department.type.js";
import type { CreateDepartmentInput } from "../schemas/department.schema.js";

import { ConflictError } from "#shared/errors/conflict-error.js";

import { findDepartmentByName, insertDepartment } from "../repositories/department.repository.js";


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
