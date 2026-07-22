import { withTransaction } from '#databases/transaction.js';

import type { UserRow } from '#modules/user/types/user.type.js';
import type { CreateUserInput } from '#modules/user/schemas/user.schema.js';

import { 
    createUser as insertUser,
    findUserById,
    findUserByEmail,
    findUserByEmployeeId
} from '#modules/user/repositories/user.repository.js';
import { findEmployeeById } from '#modules/employee/repositories/employee.repository.js';
import { findRoleById } from '#modules/role/repositories/role.repository.js';
import { createProfile } from '#modules/profile/repositories/profile.repository.js';

import { hashPassword } from '#shared/utils/password.util.js';
import { ConflictError } from '#shared/errors/conflict-error.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';


// This service function creates a new user in the authenticated user's organization.
export async function createUser(
    organizationId: string,
    input: CreateUserInput
): Promise<UserRow> {

    const result = await withTransaction(async (client) => {

        const employee = await findEmployeeById(client, organizationId, input.employeeId);

        if (!employee) {
            throw new NotFoundError('Employee not found.');
        }

        const existingUserForEmployee = await findUserByEmployeeId(client, organizationId, input.employeeId);

        if (existingUserForEmployee) {
            throw new ConflictError('Employee already has a user account.');
        }

        const role = await findRoleById(client, organizationId, input.roleId);

        if (!role) {
            throw new NotFoundError('Role not found.');
        }

        const existingUserEmail = await findUserByEmail(client, organizationId, input.email);

        if (existingUserEmail) {
            throw new ConflictError('User with this email already exists in this organization.');
        }

        const passwordHash = await hashPassword(input.password);

        const userId = await insertUser(
            client,
            input.employeeId,
            organizationId,
            input.roleId,
            input,
            passwordHash
        );

        await createProfile(client, userId);

        const createdUser = await findUserById(client, organizationId, userId);

        if (!createdUser) {
            throw new NotFoundError('User not found.');
        }

        return createdUser;
    });

    return result;
}
