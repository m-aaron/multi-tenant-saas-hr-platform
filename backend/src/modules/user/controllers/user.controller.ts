import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';

import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { CreateUserInput, UpdateUserInput } from '#modules/user/schemas/user.schema.js';

import { 
    createUser as createUserService,
    getUsers as getUsersService,
    getUserById as getUserByIdService,
    updateUser as updateUserService,
    activateUser as activateUserService
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


// This controller function handles updating a user's details for the authenticated user's organization.
export const updateUser: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;
    const userId = request.params['userId'] as string;
    const input: UpdateUserInput = request.body;

    const result = await updateUserService(organizationId, userId, input);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'User updated successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});


// This controller function handles activating a user account for the authenticated user's organization.
export const activateUser: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;
    const userId = request.params['userId'] as string;

    const result = await activateUserService(organizationId, userId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'User account activated successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});
