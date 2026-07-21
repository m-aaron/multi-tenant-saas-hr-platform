import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';
import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { RegisterOrganizationInput } from '#modules/auth/schemas/registration.schema.js';
import type { RefreshInput } from '#modules/auth/schemas/refresh.schema.js';
import type { LogoutInput } from '#modules/auth/schemas/logout.schema.js';

import { 
    registerOrganization as registerOrganizationService,
    login,
    refresh,
    logout as logoutService,
    logoutAllSessions as logoutAllSessionsService
} from '#modules/auth/services/auth.service.js';


// This controller function handles the registration of a new organization.
export const registerOrganization: RequestHandler = asyncHandler(async (request, response) => {

    const input: RegisterOrganizationInput = request.body;

    await registerOrganizationService(input);

    const responseBody: ApiSuccessResponse<null> = {
        success: true,
        message: 'Organization registered successfully.',
        data: null
    }

    response.status(201).json(responseBody);
});


// This controller function handles the login of a user.
export const loginUser: RequestHandler = asyncHandler(async (request, response) => {

    const input = request.body;

    const result = await login(input);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Login successful.',
        data: result
    }

    response.status(200).json(responseBody);
});


// This controller function handles the refreshing of an access token.
export const refreshToken: RequestHandler = asyncHandler(async (request, response) => {

    const input: RefreshInput = request.body;

    const result = await refresh(input.refreshToken);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Token refreshed successfully.',
        data: result
    }

    response.status(200).json(responseBody);
});


// This controller function handles the logout of a user from a specific session.
export const logout: RequestHandler = asyncHandler(async (request, response) => {

    const input: LogoutInput = request.body;

    await logoutService(input.refreshToken);

    const responseBody: ApiSuccessResponse<null> = {
        success: true,
        message: 'Logout successful.',
        data: null
    }

    response.status(200).json(responseBody);
});


// This controller function handles the logout of a user from all sessions.
export const logoutAllSessions: RequestHandler = asyncHandler(async (request, response) => {

    const userId = request.user?.id;

    await logoutAllSessionsService(userId);

    const responseBody: ApiSuccessResponse<null> = {
        success: true,
        message: 'All sessions logged out successfully.',
        data: null
    }

    response.status(200).json(responseBody);
});