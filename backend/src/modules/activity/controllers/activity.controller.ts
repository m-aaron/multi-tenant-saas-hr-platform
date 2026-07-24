import { type RequestHandler } from 'express';

import { asyncHandler } from '#shared/utils/async-handler.util.js';

import type { ApiSuccessResponse } from '#shared/types/api-response.type.js';

import type { ListActivityLogsQuery } from '../schemas/activity.schema.js';

import { 
    getActivityLogs as getActivityLogsService, 
    getActivityLogById as getActivityLogByIdService 
} from '../services/activity.service.js';


// This controller function handles retrieving paginated activity logs for the authenticated user's organization.
export const getActivityLogs: RequestHandler = asyncHandler(async (request, response) => {
    
    const { organizationId } = request.user!;
    const query = request.query as unknown as ListActivityLogsQuery;

    const result = await getActivityLogsService(organizationId, query);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Activity logs retrieved successfully.',
        data: result,
    };

    response.status(200).json(responseBody);
});


// This controller function handles retrieving an activity log by its ID for the authenticated user's organization.
export const getActivityLogById: RequestHandler = asyncHandler(async (request, response) => {
    
    const { organizationId } = request.user!;
    const activityId = request.params['activityId'] as string;

    const result = await getActivityLogByIdService(organizationId, activityId);

    const responseBody: ApiSuccessResponse<typeof result> = {
        success: true,
        message: 'Activity log retrieved successfully.',
        data: result,
    };

    response.status(200).json(responseBody);
});
