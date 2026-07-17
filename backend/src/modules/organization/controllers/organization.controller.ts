import { type RequestHandler } from "express";

import { asyncHandler } from "#shared/utils/async-handler.util.js";

import type { ApiSuccessResponse } from "#shared/types/api-response.type.js";

import {
    getCurrentOrganization as getCurrentOrganizationService
} from '../services/organization.service.js'


// This controller function handles the current organization.
export const getCurrentOrganization: RequestHandler = asyncHandler(async (request, response) => {

    const organizationId = request.user?.organizationId;

    const result = await getCurrentOrganizationService(organizationId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Organization retrieved successfully.',
        data: result
    }

    response.status(200).json(responseBody);
})