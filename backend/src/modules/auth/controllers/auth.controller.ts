import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.js';
import type { ApiResponse } from '#shared/types/api-response.type.js';
import type { RegisterOrganizationInput } from '#modules/auth/types/auth.type.js';

import { registerOrganization as registerOrganizationService } from '#modules/auth/services/auth.service.js';


export const registerOrganization: RequestHandler = asyncHandler(async (request, response) => {

    const input: RegisterOrganizationInput = request.body;

    await registerOrganizationService(input);

    response.status(201).json({
        success: true,
        message: 'Organization registered successfully'
    } as ApiResponse<null>);
});