import { type RequestHandler } from "express";

import { asyncHandler } from "#shared/utils/async-handler.util.js";

import type { ApiSuccessResponse } from "#shared/types/api-response.type.js";

import type { CreateDepartmentInput } from "../schemas/department.schema.js";

import { createDepartment as createDepartmentService } from "../services/department.service.js";


// This controller function handles creating a new department for the authenticated user's organization.
export const createDepartment: RequestHandler = asyncHandler(async (request, response) => {
    
    const organizationId = request.user?.organizationId;
    const input: CreateDepartmentInput = request.body;

    const result = await createDepartmentService(organizationId, input);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Department created successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});
