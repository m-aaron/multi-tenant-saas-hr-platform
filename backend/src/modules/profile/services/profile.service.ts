import { withTransaction } from '#databases/transaction.js';

import type { ProfileDetails, ProfileRow } from '#modules/profile/types/profile.type.js';
import type { UpdateProfileInput } from '#modules/profile/schemas/profile.schema.js';

import {
    findProfileByUserId,
    updateProfile as updateProfileRepository
} from '#modules/profile/repositories/profile.repository.js';

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

        return updatedProfile;
    });

    return result;
}
