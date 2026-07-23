import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import {
    UpdateProfileRequestSchema,
    UpdatePasswordRequestSchema
} from './profile.openapi.request.js';

import {
    ProfileDetailsPayloadSchema,
    ProfileRowPayloadSchema
} from './profile.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * Profile Tag
 * ------------------------------------------------------------------
 */

const PROFILE_TAG = 'Profile';


/**
 * ------------------------------------------------------------------
 * Profile Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const profilePaths = {
    '/profile': {
        get: {
            tags: [PROFILE_TAG],
            summary: 'Get profile',
            operationId: 'getProfile',
            description: 'Retrieves the full profile details for the authenticated user.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Profile retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(ProfileDetailsPayloadSchema),
                            example: {
                                success: true,
                                message: 'Profile retrieved successfully.',
                                data: {
                                    profile: {
                                        profileId: '4a5b6c7d-8e9f-0123-abcd-ef1234567890',
                                        avatarUrl: 'https://cdn.example.com/avatars/john-doe.png',
                                        createdAt: '2026-01-15T00:00:00.000Z',
                                        updatedAt: '2026-01-15T00:00:00.000Z'
                                    },
                                    organization: {
                                        organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                        organizationName: 'Acme Corp',
                                        organizationSlug: 'acme-corp',
                                        createdAt: '2026-01-01T12:00:00.000Z',
                                        updatedAt: '2026-06-01T12:00:00.000Z'
                                    },
                                    role: {
                                        roleId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                        roleName: 'employee'
                                    },
                                    user: {
                                        userId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                        email: 'john.doe@example.com',
                                        status: 'active',
                                        createdAt: '2026-01-15T00:00:00.000Z',
                                        updatedAt: '2026-01-15T00:00:00.000Z'
                                    },
                                    department: {
                                        departmentId: '5c6d7e8f-9012-3456-abcd-ef1234567890',
                                        departmentName: 'Engineering'
                                    },
                                    employee: {
                                        employeeId: '2b3c4d5e-6f7a-8901-bcde-f23456789012',
                                        employeeNumber: 'EMP-001',
                                        firstName: 'John',
                                        middleName: 'Michael',
                                        lastName: 'Doe',
                                        nameExtension: null,
                                        jobTitle: 'Software Engineer',
                                        employmentStatus: 'regular',
                                        hireDate: '2026-01-15T00:00:00.000Z',
                                        createdAt: '2026-01-15T00:00:00.000Z',
                                        updatedAt: '2026-01-15T00:00:00.000Z'
                                    }
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
                404: {
                    description: 'Profile not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Profile not found.'
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
            tags: [PROFILE_TAG],
            summary: 'Update profile',
            operationId: 'updateProfile',
            description: 'Updates the profile of the authenticated user.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: UpdateProfileRequestSchema,
                        example: {
                            avatarUrl: 'https://cdn.example.com/avatars/john-doe-updated.png'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Profile updated successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(ProfileRowPayloadSchema),
                            example: {
                                success: true,
                                message: 'Profile updated successfully.',
                                data: {
                                    id: '4a5b6c7d-8e9f-0123-abcd-ef1234567890',
                                    userId: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    avatarUrl: 'https://cdn.example.com/avatars/john-doe-updated.png',
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
                                        field: 'avatarUrl',
                                        message: 'Invalid avatar URL.'
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
                404: {
                    description: 'Profile not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Profile not found.'
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
    '/profile/password': {
        patch: {
            tags: [PROFILE_TAG],
            summary: 'Update password',
            operationId: 'updatePassword',
            description: 'Updates the password of the authenticated user.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: UpdatePasswordRequestSchema,
                        example: {
                            currentPassword: 'OldPassword123!',
                            newPassword: 'NewPassword456!'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Password updated successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema({ type: 'null' as const }),
                            example: {
                                success: true,
                                message: 'Password updated successfully.',
                                data: null
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
                                        field: 'newPassword',
                                        message: 'New password must be at least 8 characters long.'
                                    }
                                ]
                            }
                        }
                    }
                },
                401: {
                    description: 'Missing or invalid access token, or current password is incorrect.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            examples: {
                                invalidToken: {
                                    summary: 'Invalid access token',
                                    value: {
                                        success: false,
                                        message: 'Invalid or expired access token.'
                                    }
                                },
                                incorrectPassword: {
                                    summary: 'Incorrect current password',
                                    value: {
                                        success: false,
                                        message: 'Current password is incorrect.'
                                    }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Profile or user not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Profile not found.'
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
