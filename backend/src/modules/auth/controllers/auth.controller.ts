import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.js';
import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { RegisterOrganizationInput } from '#modules/auth/schemas/auth.schema.js';

import { 
    registerOrganization as registerOrganizationService,
    login
} from '#modules/auth/services/auth.service.js';


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

export const loginUser: RequestHandler = asyncHandler(async (request, response) => {

    const input = request.body;

    const result = await login(input);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Login successful',
        data: result
    }

    response.status(200).json(responseBody);
});