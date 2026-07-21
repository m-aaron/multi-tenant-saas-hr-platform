import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import {
    RegisterOrganizationRequestSchema,
    LoginRequestSchema,
    RefreshTokenRequestSchema,
    LogoutRequestSchema,
} from './auth.openapi.request.js';

import {
    RegisterOrganizationPayloadSchema,
    LoginPayloadSchema,
    RefreshTokenPayloadSchema,
    LogoutPayloadSchema,
    LogoutAllSessionsPayloadSchema,
} from './auth.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * Authentication Tag
 * ------------------------------------------------------------------
 */

const AUTH_TAG = 'Authentication';


/**
 * ------------------------------------------------------------------
 * Authentication Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const authPaths = {

    /**
     * POST /auth/register
     */
    '/auth/register': {
        post: {
            tags: [AUTH_TAG],
            summary: 'Register organization',
            operationId: 'registerOrganization',
            description:
                'Creates a new organization together with its initial owner account.',

            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: RegisterOrganizationRequestSchema,
                        examples: {
                            default: {
                                summary: 'Organization Registration',
                                value: {
                                    name: 'Acme Corporation',
                                    slug: 'acme-corporation',
                                    firstName: 'John',
                                    middleName: 'Michael',
                                    lastName: 'Doe',
                                    nameExtension: 'Jr.',
                                    ownerEmail: 'owner@acme.com',
                                    password: 'P@ssw0rd123',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                201: {
                    description: 'Organization registered successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(RegisterOrganizationPayloadSchema),
                            example: {
                                success: true,
                                message: 'Organization registered successfully.',
                                data: null,
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
                                    field: 'ownerEmail', 
                                    message: 'Invalid email address.' 
                                }],
                            },
                        },
                    },
                },
                404: {
                    description: 'Owner role not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Owner role not found.',
                            },
                        },
                    },
                },
                409: {
                    description: 'Organization slug or email already exists.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Organization slug or email already exists.',
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
                                message: 'Internal server error.',
                            },
                        },
                    },
                },
            },
        },
    },


    /**
     * POST /auth/login
     */
    '/auth/login': {
        post: {
            tags: [AUTH_TAG],
            summary: 'Login',
            operationId: 'login',
            description:
                'Authenticates a user within an organization and returns the authenticated user plus a token pair.',

            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: LoginRequestSchema,
                        examples: {
                            default: {
                                summary: 'Login Request',
                                value: {
                                    organizationSlug: 'acme-corporation',
                                    email: 'owner@example.com',
                                    password: 'P@ssw0rd123',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Login successful.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(
                                LoginPayloadSchema,
                            ),
                            example: {
                                success: true,
                                message: 'Login successful.',
                                data: {
                                    user: {
                                        id: '3f7d8c1e-2b4a-4d9f-8c6e-1a2b3c4d5e6f',
                                        organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                        employeeId: '9f8e7d6c-5b4a-3c2d-1e0f-123456789abc',
                                        roleId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                        email: 'owner@example.com',
                                    },
                                    tokens: {
                                        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                    },
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
                                    field: 'email', 
                                    message: 'Invalid email address.' 
                                }],
                            },
                        },
                    },
                },
                401: {
                    description: 'Invalid credentials.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Invalid credentials.',
                            },
                        },
                    },
                },
                403: {
                    description: 'Forbidden. User account is not active.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'User account is not active.',
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
                                message: 'Internal server error.',
                            },
                        },
                    },
                },
            },
        },
    },


    /**
     * POST /auth/refresh
     */
    '/auth/refresh': {
        post: {
            tags: [AUTH_TAG],
            summary: 'Refresh access token',
            operationId: 'refreshToken',
            description:
                'Generates a new access token and refresh token using a valid refresh token.',

            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: RefreshTokenRequestSchema,
                        examples: {
                            default: {
                                summary: 'Refresh Token',
                                value: {
                                    refreshToken:
                                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Token refreshed successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(
                                RefreshTokenPayloadSchema,
                            ),
                            example: {
                                success: true,
                                message: 'Token refreshed successfully.',
                                data: {
                                    accessToken: '...',
                                    refreshToken: '...',
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
                                    field: 'refreshToken', 
                                    message: 'Refresh token is required.' 
                                }],
                            },
                        },
                    },
                },
                401: {
                    description: 'Invalid or expired refresh token.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Invalid or expired refresh token.',
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
                                message: 'Internal server error.',
                            },
                        },
                    },
                },
            },
        },
    },


    /**
     * POST /auth/logout
     */
    '/auth/logout': {
        post: {
            tags: [AUTH_TAG],
            summary: 'Logout',
            operationId: 'logout',
            description:
                'Revokes the current authentication session using the provided refresh token.',

            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: LogoutRequestSchema,
                        examples: {
                            default: {
                                summary: 'Logout',
                                value: {
                                    refreshToken:
                                        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Logout successful.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(
                                LogoutPayloadSchema,
                            ),
                            example: {
                                success: true,
                                message: 'Logout successful.',
                                data: null,
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
                                    field: 'refreshToken', 
                                    message: 'Refresh token is required.' 
                                }],
                            },
                        },
                    },
                },
                401: {
                    description: 'Invalid or expired refresh token.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Invalid or expired refresh token.',
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
                                message: 'Internal server error.',
                            },
                        },
                    },
                },
            },
        },
    },


    /**
     * POST /auth/logout-all
     */
    '/auth/logout-all': {
        post: {
            tags: [AUTH_TAG],
            summary: 'Logout from all devices',
            operationId: 'logoutAllSessions',
            description: 'Revokes every active session belonging to the authenticated user.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'All sessions logged out successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(
                                LogoutAllSessionsPayloadSchema,
                            ),
                            example: {
                                success: true,
                                message: 'All sessions logged out successfully.',
                                data: null,
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
                500: {
                    description: 'Internal server error.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Internal server error.',
                            },
                        },
                    },
                },
            },
        },
    },
};