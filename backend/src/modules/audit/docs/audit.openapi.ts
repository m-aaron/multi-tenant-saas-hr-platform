import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import { ListAuditLogsQueryParams } from './audit.openapi.request.js';

import {
    AuditLogPayloadSchema,
    PaginatedAuditLogsPayloadSchema,
} from './audit.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * Audit Tag
 * ------------------------------------------------------------------
 */

const AUDIT_TAG = 'Audit';


/**
 * ------------------------------------------------------------------
 * Audit Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const auditPaths = {
    '/audits': {
        get: {
            tags: [AUDIT_TAG],
            summary: 'Get audit logs',
            operationId: 'getAuditLogs',
            description: 'Returns a paginated list of security audit log entries for the authenticated user\'s organization. Accessible by owners and administrators.',
            security: [{ bearerAuth: [] }],
            parameters: ListAuditLogsQueryParams,
            responses: {
                200: {
                    description: 'Audit logs retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(PaginatedAuditLogsPayloadSchema),
                            example: {
                                success: true,
                                message: 'Audit logs retrieved successfully.',
                                data: {
                                    items: [
                                        {
                                            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                                            organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                            actorId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                            action: 'login',
                                            entity: 'session',
                                            entityId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                            metadata: {
                                                userId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                                email: 'user@example.com'
                                            },
                                            createdAt: '2026-07-27T10:00:00Z'
                                        },
                                        {
                                            id: 'b2c3d4e5-f6a7-8901-bcde-f01234567891',
                                            organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                            actorId: null,
                                            action: 'login_failed',
                                            entity: 'session',
                                            entityId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                            metadata: {
                                                email: 'user@example.com',
                                                reason: 'Invalid password.'
                                            },
                                            createdAt: '2026-07-27T10:05:00Z'
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
    '/audits/{auditId}': {
        get: {
            tags: [AUDIT_TAG],
            summary: 'Get audit log by ID',
            operationId: 'getAuditLogById',
            description: 'Returns a single security audit log entry by its ID, scoped to the authenticated user\'s organization. Accessible by owners and administrators.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'auditId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the audit log entry.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Audit log retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(AuditLogPayloadSchema),
                            example: {
                                success: true,
                                message: 'Audit log retrieved successfully.',
                                data: {
                                    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    actorId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                    action: 'login',
                                    entity: 'session',
                                    entityId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                    metadata: {
                                        userId: 'f1e2d3c4-b5a6-7890-abcd-ef0987654321',
                                        email: 'user@example.com'
                                    },
                                    createdAt: '2026-07-27T10:00:00Z'
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
                    description: 'Audit log not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Audit log not found.'
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
