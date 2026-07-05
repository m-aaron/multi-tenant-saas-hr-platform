import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.js';
import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { RegisterOrganizationInput } from '#modules/auth/types/auth.type.js';

import { registerOrganization as registerOrganizationService } from '#modules/auth/services/auth.service.js';


export const registerOrganization: RequestHandler = asyncHandler(async (request, response) => {

    const input: RegisterOrganizationInput = request.body;

    await registerOrganizationService(input);

    const responseBody: ApiSuccessResponse<null> = {
        success: true,
        message: 'Organization registered successfully',
        data: null
    }

    response.status(201).json(responseBody);
});