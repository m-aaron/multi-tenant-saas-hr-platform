import { withTransaction } from '#databases/transaction.js';

import type { ProfileDetails } from '#modules/profile/types/profile.type.js';

import { findProfileByUserId } from '#modules/profile/repositories/profile.repository.js';

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
