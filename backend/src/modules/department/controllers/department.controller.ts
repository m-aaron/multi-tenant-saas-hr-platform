import { type RequestHandler } from "express";

import { asyncHandler } from "#shared/utils/async-handler.util.js";

import type { ApiSuccessResponse } from "#shared/types/api-response.type.js";

import type { CreateDepartmentInput, UpdateDepartmentInput } from "../schemas/department.schema.js";

import { 
    createDepartment as createDepartmentService,
    updateDepartment as updateDepartmentService,
    getDepartments as getDepartmentsService,
    getDepartmentById as getDepartmentByIdService,
    deleteDepartment as deleteDepartmentService,
} from "../services/department.service.js";


// This controller function handles creating a new department for the authenticated user's organization.
export const createDepartment: RequestHandler = asyncHandler(async (request, response) => {
    
    const { organizationId } = request.user!;
    const input: CreateDepartmentInput = request.body;

    const result = await createDepartmentService(organizationId, input);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Department created successfully.',
        data: result
    };

    response.status(201).json(responseBody);
});


// This controller function handles updating a department's details for the authenticated user's organization.
export const updateDepartment: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;
    const departmentId = request.params['departmentId'] as string;
    const input: UpdateDepartmentInput = request.body;

    const result = await updateDepartmentService(organizationId, departmentId, input);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Department updated successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});


// This controller function handles retrieving all departments for the authenticated user's organization.
export const getDepartments: RequestHandler = asyncHandler(async (request, response) => {
    
    const { organizationId } = request.user!;

    const result = await getDepartmentsService(organizationId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Departments retrieved successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});


// This controller function handles retrieving a department by its ID for the authenticated user's organization.
export const getDepartmentById: RequestHandler = asyncHandler(async (request, response) => {
    
    const { organizationId } = request.user!;
    const departmentId = request.params['departmentId'] as string;

    const result = await getDepartmentByIdService(organizationId, departmentId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Department retrieved successfully.',
        data: result
    };

    response.status(200).json(responseBody);
});


// This controller function handles soft deleting a department by its ID for the authenticated user's organization.
export const deleteDepartment: RequestHandler = asyncHandler(async (request, response) => {

    const { organizationId } = request.user!;
    const departmentId = request.params['departmentId'] as string;

    await deleteDepartmentService(organizationId, departmentId);

    const responseBody: ApiSuccessResponse<null> = {
        success: true,
        message: 'Department deleted successfully.',
        data: null
    };

    response.status(200).json(responseBody);
});