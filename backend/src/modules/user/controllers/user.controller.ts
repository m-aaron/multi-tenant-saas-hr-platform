import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';

import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { CreateUserInput } from '#modules/user/schemas/user.schema.js';

import { 
    createUser as createUserService,
    getUsers as getUsersService,
    getUserById as getUserByIdService
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


// This controller function handles retrieving all users for the authenticated user's organization.
export const getUsers: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;

    const result = await getUsersService(organizationId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Users retrieved successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});


// This controller function handles retrieving a user by ID for the authenticated user's organization.
export const getUserById: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;
    const userId = request.params['userId'] as string;

    const result = await getUserByIdService(organizationId, userId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'User retrieved successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});
