import type { RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';

import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';
import type { CreateEmployeeInput } from '#modules/employee/schemas/employee.schema.js';
import type { EmployeeRow } from '#modules/employee/types/employee.type.js';

import { createEmployee as createEmployeeService } from '#modules/employee/services/employee.service.js';


// This controller function handles creating a new employee for the authenticated user's organization.
export const createEmployee: RequestHandler = asyncHandler(async (request, response) => {

    const organizationId = request.user?.organizationId as string;
    const input: CreateEmployeeInput = request.body;

    const result = await createEmployeeService(organizationId, input);

    const responseBody: ApiSuccessResponse<EmployeeRow> = {
        success: true,
        message: 'Employee created successfully.',
        data: result
    };

    response.status(201).json(responseBody);
});
