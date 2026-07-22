import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';

import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { CreateUserInput } from '#modules/user/schemas/user.schema.js';

import { 
    createUser as createUserService
} from '#modules/user/services/user.service.js';


// This controller function handles creating a new user for the authenticated user's organization.
export const createUser: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;
    const input: CreateUserInput = request.body;

    const result = await createUserService(organizationId, input);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'User created successfully.',
        data: result
    };

    response.status(201).json(responseBody);
});
