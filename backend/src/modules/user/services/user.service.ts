import { withTransaction } from '#databases/transaction.js';

import type { UserRow } from '#modules/user/types/user.type.js';
import type { CreateUserInput, UpdateUserInput } from '#modules/user/schemas/user.schema.js';

import { 
    createUser as insertUser,
    findUserById,
    findUserByEmail,
    findUserByEmployeeId,
    findUsersByOrganizationId,
    updateUser as updateUserRepository
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


// This service function retrieves all active users in a user's organization.
export async function getUsers(
    organizationId: string
): Promise<UserRow[]> {

    const result = await withTransaction(async (client) => {
        return await findUsersByOrganizationId(client, organizationId);
    });

    return result;
}


// This service function retrieves a user by ID.
export async function getUserById(
    organizationId: string,
    id: string
): Promise<UserRow | null> {

    const result = await withTransaction(async (client) => {

        const user = await findUserById(client, organizationId, id);

        if (!user) {
            throw new NotFoundError('User not found.');
        }

        return user;
    });

    return result;
}


// This service function updates a user's details.
export async function updateUser(
    organizationId: string,
    id: string,
    input: UpdateUserInput
): Promise<UserRow> {

    const result = await withTransaction(async (client) => {

        const currentUser = await findUserById(client, organizationId, id);

        if (!currentUser) {
            throw new NotFoundError('User not found.');
        }

        if (input.roleId) {
            const role = await findRoleById(client, organizationId, input.roleId);

            if (!role) {
                throw new NotFoundError('Role not found.');
            }
        }

        if (input.email && input.email !== currentUser.email) {
            const existingUserEmail = await findUserByEmail(client, organizationId, input.email);

            if (existingUserEmail) {
                throw new ConflictError('User with this email already exists in this organization.');
            }
        }

        let passwordHash: string | undefined;

        if (input.password) {
            passwordHash = await hashPassword(input.password);
        }

        const updatedUser = await updateUserRepository(
            client,
            organizationId,
            id,
            input,
            passwordHash
        );

        if (!updatedUser) {
            throw new NotFoundError('User not found.');
        }

        return updatedUser;
    });

    return result;
}
