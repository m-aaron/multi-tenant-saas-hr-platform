import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import {
    UpdateOrganizationRequestSchema
} from './organization.openapi.request.js';

import {
    GetOrganizationPayloadSchema,
    UpdateOrganizationPayloadSchema,
} from './organization.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * Authentication Tag
 * ------------------------------------------------------------------
 */

const ORGANIZATION_TAG = 'Organization';


/**
 * ------------------------------------------------------------------
 * Authentication Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const organizationPaths = {
    '/organizations/me': {
        get: {
            tags: [ORGANIZATION_TAG],
            summary: 'Get organization',
            operationId: 'getOrganization',
            description: 'Get organization.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Organization retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(GetOrganizationPayloadSchema),
                            example: {
                                success: true,
                                message: 'Organization retrieved successfully.',
                                data: {
                                    id: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    name: 'Acme Corp',
                                    slug: 'acme-corp',
                                    createdAt: '2026-01-01T12:00:00Z',
                                    updatedAt: '2026-06-01T12:00:00Z'
                                },
                            },
                        },
                    },
                },
                401: {
                    description: 'Missing or invalid access token.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Invalid or expired access token.',
                            },
                        },
                    },
                },
                403: {
                    description: 'Forbidden. The organization is not active or user has insufficient privileges.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: { 
                                success: false, 
                                message: 'Organization is not active.' 
                            },
                        },
                    },
                },
                404: {
                    description: 'Organization not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: { 
                                success: false, 
                                message: 'Organization not found.' 
                            },
                        },
                    },
                },
                500: {
                    description: 'Internal server error.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: { 
                                success: false, 
                                message: 'Internal server error.' 
                            },
                        },
                    },
                },
            },
        },
        patch: {
            tags: [ORGANIZATION_TAG],
            summary: 'Update Organization',
            operationId: 'updateOrganization',
            description: 'Updates Organization.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: UpdateOrganizationRequestSchema,
                        examples: {
                            default: {
                                summary: 'Update organization',
                                value: { organizationName: 'Acme Corp' },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Organization updated successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(UpdateOrganizationPayloadSchema),
                            example: {
                                success: true,
                                message: 'Organization updated successfully.',
                                data: {
                                    id: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    name: 'Acme Corp',
                                    slug: 'acme-corp',
                                    createdAt: '2026-01-01T12:00:00Z',
                                    updatedAt: '2026-06-01T12:00:00Z'
                                },
                            },
                        },
                    },
                },
                400: {
                    description: 'Validation failed.',
                    content: {
                        'application/json': {
                            schema: validationErrorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Validation failed.',
                                errors: [{ 
                                    field: 'organizationName', 
                                    message: 'Organization name must be at least 3 characters.' 
                                }],
                            },
                        },
                    },
                },
                401: {
                    description: 'Missing or invalid access token.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Invalid or expired access token.',
                            },
                        },
                    },
                },
                403: {
                    description: 'Forbidden. The organization is not active or user has insufficient privileges.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: { 
                                success: false, 
                                message: 'Organization is not active.' 
                            },
                        },
                    },
                },
                500: {
                    description: 'Internal server error.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: { 
                                success: false, 
                                message: 'Internal server error.' 
                            },
                        },
                    },
                },
            },
        },
    },
};