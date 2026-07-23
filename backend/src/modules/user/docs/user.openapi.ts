import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import {
    CreateUserRequestSchema,
    InviteUserRequestSchema,
    UpdateUserRequestSchema
} from './user.openapi.request.js';

import {
    UserPayloadSchema,
    UserListPayloadSchema
} from './user.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * User Tag
 * ------------------------------------------------------------------
 */

const USER_TAG = 'User';


/**
 * ------------------------------------------------------------------
 * User Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const userPaths = {
    '/users': {
        get: {
            tags: [USER_TAG],
            summary: 'Get users list',
            operationId: 'getUsers',
            description: 'Get list of active users for the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Users retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(UserListPayloadSchema),
                            example: {
                                success: true,
                                message: 'Users retrieved successfully.',
                                data: [
                                    {
                                        id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                        employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                                        organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                        roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                        email: 'john.doe@example.com',
                                        status: 'active',
                                        createdAt: '2026-01-15T00:00:00.000Z',
                                        updatedAt: '2026-01-15T00:00:00.000Z'
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
        },
        post: {
            tags: [USER_TAG],
            summary: 'Create User',
            operationId: 'createUser',
            description: 'Creates a new user with password in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: CreateUserRequestSchema,
                        example: {
                            employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                            roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                            email: 'john.doe@example.com',
                            password: 'SecurePassword123!'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'User created successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(UserPayloadSchema),
                            example: {
                                success: true,
                                message: 'User created successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    email: 'john.doe@example.com',
                                    status: 'active',
                                    createdAt: '2026-01-15T00:00:00.000Z',
                                    updatedAt: '2026-01-15T00:00:00.000Z'
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation failed.',
                    content: {
                        'application/json': {
                            schema: validationErrorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Validation failed.',
                                errors: [
                                    {
                                        field: 'password',
                                        message: 'Password must be at least 8 characters.'
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
                404: {
                    description: 'Employee or Role not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Employee not found.'
                            }
                        }
                    }
                },
                409: {
                    description: 'Conflict. Employee already has a user account or email already exists.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Employee already has a user account.'
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
    '/users/invite': {
        post: {
            tags: [USER_TAG],
            summary: 'Invite User',
            operationId: 'inviteUser',
            description: 'Invites a new user without password (status: invited) in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: InviteUserRequestSchema,
                        example: {
                            employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                            roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                            email: 'jane.smith@example.com'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'User invited successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(UserPayloadSchema),
                            example: {
                                success: true,
                                message: 'User invited successfully.',
                                data: {
                                    id: '2a3b4c5d-6e7f-8901-bcde-f12345678901',
                                    employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    email: 'jane.smith@example.com',
                                    status: 'invited',
                                    createdAt: '2026-01-15T00:00:00.000Z',
                                    updatedAt: '2026-01-15T00:00:00.000Z'
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation failed.',
                    content: {
                        'application/json': {
                            schema: validationErrorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Validation failed.',
                                errors: [
                                    {
                                        field: 'email',
                                        message: 'Invalid email address.'
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
                404: {
                    description: 'Employee or Role not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Employee not found.'
                            }
                        }
                    }
                },
                409: {
                    description: 'Conflict. Employee already has a user account or email already exists.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Employee already has a user account.'
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
    '/users/{userId}': {
        get: {
            tags: [USER_TAG],
            summary: 'Get User by ID',
            operationId: 'getUserById',
            description: 'Get details of a specific user in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'userId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the user.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'User retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(UserPayloadSchema),
                            example: {
                                success: true,
                                message: 'User retrieved successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    email: 'john.doe@example.com',
                                    status: 'active',
                                    createdAt: '2026-01-15T00:00:00.000Z',
                                    updatedAt: '2026-01-15T00:00:00.000Z'
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
                    description: 'User not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'User not found.'
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
        },
        patch: {
            tags: [USER_TAG],
            summary: 'Update User',
            operationId: 'updateUser',
            description: 'Updates details of a specific user in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'userId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the user.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: UpdateUserRequestSchema,
                        example: {
                            email: 'john.updated@example.com',
                            status: 'active'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'User updated successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(UserPayloadSchema),
                            example: {
                                success: true,
                                message: 'User updated successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    email: 'john.updated@example.com',
                                    status: 'active',
                                    createdAt: '2026-01-15T00:00:00.000Z',
                                    updatedAt: '2026-01-16T00:00:00.000Z'
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Validation failed.',
                    content: {
                        'application/json': {
                            schema: validationErrorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Validation failed.',
                                errors: [
                                    {
                                        field: 'email',
                                        message: 'Invalid email address.'
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
                404: {
                    description: 'User or Role not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'User not found.'
                            }
                        }
                    }
                },
                409: {
                    description: 'Conflict. Email already exists in this organization.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'User with this email already exists in this organization.'
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
    '/users/{userId}/activate': {
        patch: {
            tags: [USER_TAG],
            summary: 'Activate User Account',
            operationId: 'activateUser',
            description: 'Activates a user account in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'userId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the user.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'User account activated successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(UserPayloadSchema),
                            example: {
                                success: true,
                                message: 'User account activated successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    email: 'john.doe@example.com',
                                    status: 'active',
                                    createdAt: '2026-01-15T00:00:00.000Z',
                                    updatedAt: '2026-01-16T00:00:00.000Z'
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
                    description: 'User not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'User not found.'
                            }
                        }
                    }
                },
                409: {
                    description: 'Conflict. User account is already active.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'User account is already active.'
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
