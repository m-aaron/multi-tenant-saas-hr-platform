import { type RequestHandler } from "express";

import { asyncHandler } from "#shared/utils/async-handler.util.js";

import type { ApiSuccessResponse } from "#shared/types/api-response.type.js";
import type { UpdateOrganizationInput } from "../schemas/organization.schema.js";

import {
    getCurrentOrganization as getCurrentOrganizationService,
    updateCurrentOrganization as updateCurrentOrganizationService
} from '../services/organization.service.js'


// This controller function handles the current organization.
export const getCurrentOrganization: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;

    const result = await getCurrentOrganizationService(organizationId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Organization retrieved successfully.',
        data: result
    }

    response.status(200).json(responseBody);
});


// This controller function handles the updating organization information.
export const updateCurrentOrganization: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;
    const input: UpdateOrganizationInput = request.body;

    const result = await updateCurrentOrganizationService(input, organizationId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Organization updated successfully.',
        data: result
    }

    response.status(200).json(responseBody);
})