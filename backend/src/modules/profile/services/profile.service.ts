import { withTransaction } from '#databases/transaction.js';

import type { ProfileDetails, ProfileRow } from '#modules/profile/types/profile.type.js';
import type { UpdatePasswordInput, UpdateProfileInput } from '#modules/profile/schemas/profile.schema.js';

import { ActivityLogService } from "#modules/activity/services/activity.service.js";
import { AuditLogService } from "#modules/audit/services/audit.service.js";

import {
    findProfileByUserId,
    updateProfile as updateProfileRepository
} from '#modules/profile/repositories/profile.repository.js';
import { findUserWithPasswordHashById, updateUser } from '#modules/user/repositories/user.repository.js';

import { hashPassword, verifyPassword } from '#shared/utils/password.util.js';
import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';


// This service function retrieves the full profile details for the authenticated user.
export async function getProfile(
    userId: string
): Promise<ProfileDetails> {

    const result = await withTransaction(async (client) => {

        const profile = await findProfileByUserId(client, userId);

        if (!profile) {
            throw new NotFoundError('Profile not found.');
        }

        return profile;
    });

    return result;
}


// This service function updates the profile of the authenticated user.
export async function updateProfile(
    userId: string,
    actorId: string,
    input: UpdateProfileInput
): Promise<ProfileRow> {

    const result = await withTransaction(async (client) => {

        const currentProfile = await findProfileByUserId(client, userId);

        if (!currentProfile) {
            throw new NotFoundError('Profile not found.');
        }

        const updatedProfile = await updateProfileRepository(client, userId, input);

        if (!updatedProfile) {
            throw new NotFoundError('Profile not found.');
        }

        await ActivityLogService.logProfileUpdated(
            { organizationId: currentProfile.organization.organizationId, actorId, client },
            { userId: updatedProfile.userId }
        );

        await AuditLogService.logProfileUpdated(
            { organizationId: currentProfile.organization.organizationId, actorId, client },
            { userId: updatedProfile.userId }
        );

        return updatedProfile;
    });

    return result;
}


// This service function updates the authenticated user's password.
export async function updatePassword(
    userId: string,
    actorId: string,
    input: UpdatePasswordInput
): Promise<void> {

    await withTransaction(async (client) => {

        const profile = await findProfileByUserId(client, userId);

        if (!profile) {
            throw new NotFoundError('Profile not found.');
        }

        const user = await findUserWithPasswordHashById(client, profile.organization.organizationId, userId);

        if (!user) {
            throw new NotFoundError('User not found.');
        }

        const isCurrentPasswordValid = await verifyPassword(user.passwordHash ?? null, input.currentPassword);

        if (!isCurrentPasswordValid) {
            throw new UnauthorizedError('Current password is incorrect.');
        }

        const newPasswordHash = await hashPassword(input.newPassword);

        const updatedUser = await updateUser(
            client,
            profile.organization.organizationId,
            userId,
            {},
            newPasswordHash
        );

        if (!updatedUser) {
            throw new NotFoundError('User not found.');
        }

        await ActivityLogService.logProfilePasswordChanged(
            { organizationId: profile.organization.organizationId, actorId, client },
            { userId: updatedUser.id }
        );

        await AuditLogService.logProfilePasswordChanged(
            { organizationId: profile.organization.organizationId, actorId, client },
            { userId: updatedUser.id }
        );
    });
}
