import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import { ListActivityLogsQueryParams } from './activity.openapi.request.js';

import {
    ActivityLogPayloadSchema,
    PaginatedActivityLogsPayloadSchema,
} from './activity.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * Activity Tag
 * ------------------------------------------------------------------
 */

const ACTIVITY_TAG = 'Activity';


/**
 * ------------------------------------------------------------------
 * Activity Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const activityPaths = {
    '/activities': {
        get: {
            tags: [ACTIVITY_TAG],
            summary: 'Get activity logs',
            operationId: 'getActivityLogs',
            description: 'Returns a paginated list of activity log entries for the authenticated user\'s organization. Accessible by owners, administrators, and HR managers.',
            security: [{ bearerAuth: [] }],
            parameters: ListActivityLogsQueryParams,
            responses: {
                200: {
                    description: 'Activity logs retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(PaginatedActivityLogsPayloadSchema),
                            example: {
                                success: true,
                                message: 'Activity logs retrieved successfully.',
                                data: {
                                    items: [
                                        {
                                            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                                            organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                            actorId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                            eventType: 'department.created',
                                            metadata: {
                                                departmentId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                                name: 'Engineering'
                                            },
                                            createdAt: '2026-07-01T08:00:00Z'
                                        },
                                        {
                                            id: 'b2c3d4e5-f6a7-8901-bcde-f01234567891',
                                            organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                            actorId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                            eventType: 'employee.created',
                                            metadata: {
                                                employeeId: '2b3c4d5e-6f7a-8901-bcde-f01234567892',
                                                employeeNumber: 'EMP-001',
                                                firstName: 'Juan',
                                                lastName: 'Dela Cruz'
                                            },
                                            createdAt: '2026-07-02T09:30:00Z'
                                        }
                                    ],
                                    page: 1,
                                    limit: 20,
                                    total: 2
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation failed. Invalid query parameters.',
                    content: {
                        'application/json': {
                            schema: validationErrorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Validation failed.',
                                errors: [
                                    {
                                        field: 'page',
                                        message: 'Page must be at least 1.'
                                    }
                                ]
                            }
                        }
                    }
                },
                401: {
                    description: 'Missing or invalid access token.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Invalid or expired access token.'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden. User has insufficient privileges.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'You do not have permission to perform this action.'
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal server error.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Internal server error.'
                            }
                        }
                    }
                }
            }
        }
    },
    '/activities/{activityId}': {
        get: {
            tags: [ACTIVITY_TAG],
            summary: 'Get activity log by ID',
            operationId: 'getActivityLogById',
            description: 'Returns a single activity log entry by its ID, scoped to the authenticated user\'s organization. Accessible by owners, administrators, and HR managers.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'activityId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the activity log entry.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Activity log retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(ActivityLogPayloadSchema),
                            example: {
                                success: true,
                                message: 'Activity log retrieved successfully.',
                                data: {
                                    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    actorId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                    eventType: 'organization.updated',
                                    metadata: {
                                        name: 'Acme Corp Rebranded'
                                    },
                                    createdAt: '2026-07-25T02:00:00Z'
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Missing or invalid access token.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Invalid or expired access token.'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden. User has insufficient privileges.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'You do not have permission to perform this action.'
                            }
                        }
                    }
                },
                404: {
                    description: 'Activity log not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Activity log not found.'
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal server error.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Internal server error.'
                            }
                        }
                    }
                }
            }
        }
    }
};
