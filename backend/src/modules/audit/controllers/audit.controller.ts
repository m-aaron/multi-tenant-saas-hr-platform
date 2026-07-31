import { type RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';

import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';

import { listAuditLogsQuerySchema } from '../schemas/audit.schema.js';

import {
    getAuditLogs as getAuditLogsService,
    getAuditLogById as getAuditLogByIdService,
} from '../services/audit.service.js';


// This controller function handles retrieving paginated audit logs for the authenticated user's organization.
export const getAuditLogs: RequestHandler = asyncHandler(async (request, response) => {
    
    const { organizationId } = request.user!;
    const query = listAuditLogsQuerySchema.parse(request.query);

    const result = await getAuditLogsService(organizationId, query);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Audit logs retrieved successfully.',
        data: result,
    };

    response.status(200).json(responseBody);
});

// This controller function handles retrieving an audit log by its ID for the authenticated user's organization.
export const getAuditLogById: RequestHandler = asyncHandler(async (request, response) => {
    
    const { organizationId } = request.user!;
    const auditId = request.params['auditId'] as string;

    const result = await getAuditLogByIdService(organizationId, auditId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Audit log retrieved successfully.',
        data: result,
    };

    response.status(200).json(responseBody);
});
