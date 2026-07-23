import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';

import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { ProfileDetails, ProfileRow } from '#modules/profile/types/profile.type.js';
import type { UpdateProfileInput } from '#modules/profile/schemas/profile.schema.js';

import {
    getProfile as getProfileService,
    updateProfile as updateProfileService
} from '#modules/profile/services/profile.service.js';


// This controller function handles retrieving the full profile details for the authenticated user.
export const getProfile: RequestHandler = asyncHandler(async (request, response) => {

    const { id } = request.user!;

    const result = await getProfileService(id);

    const responseBody: ApiSuccessResponse<ProfileDetails> = {
        success: true,
        message: 'Profile retrieved successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});


// This controller function handles updating the profile of the authenticated user.
export const updateProfile: RequestHandler = asyncHandler(async (request, response) => {

    const { id } = request.user!;
    const input: UpdateProfileInput = request.body;

    const result = await updateProfileService(id, input);

    const responseBody: ApiSuccessResponse<ProfileRow> = {
        success: true,
        message: 'Profile updated successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});
