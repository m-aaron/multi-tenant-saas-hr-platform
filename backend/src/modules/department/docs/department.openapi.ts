import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import {
    CreateDepartmentRequestSchema,
    UpdateDepartmentRequestSchema
} from './department.openapi.request.js';

import {
    DepartmentPayloadSchema,
    DepartmentListPayloadSchema,
    DeleteDepartmentPayloadSchema
} from './department.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * Department Tag
 * ------------------------------------------------------------------
 */

const DEPARTMENT_TAG = 'Department';


/**
 * ------------------------------------------------------------------
 * Department Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const departmentPaths = {
    '/departments': {
        get: {
            tags: [DEPARTMENT_TAG],
            summary: 'Get departments list',
            operationId: 'getDepartments',
            description: 'Get list of departments for the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Departments retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(DepartmentListPayloadSchema),
                            example: {
                                success: true,
                                message: 'Departments retrieved successfully.',
                                data: [
                                    {
                                        id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                        organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                        name: 'Engineering',
                                        createdAt: '2026-01-01T12:00:00Z',
                                        updatedAt: '2026-06-01T12:00:00Z'
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
                                message: 'You do not have permission to perform this action..'
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
            tags: [DEPARTMENT_TAG],
            summary: 'Create Department',
            operationId: 'createDepartment',
            description: 'Creates a new department in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: CreateDepartmentRequestSchema,
                        example: {
                            name: 'Engineering'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Department created successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(DepartmentPayloadSchema),
                            example: {
                                success: true,
                                message: 'Department created successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    name: 'Engineering',
                                    createdAt: '2026-01-01T12:00:00Z',
                                    updatedAt: '2026-06-01T12:00:00Z'
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
                                        field: 'name',
                                        message: 'Department name must be at least 3 characters.'
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
                409: {
                    description: 'Conflict. Department name already exists.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Department name already exists in this organization.'
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
    '/departments/{departmentId}': {
        get: {
            tags: [DEPARTMENT_TAG],
            summary: 'Get Department by ID',
            operationId: 'getDepartmentById',
            description: 'Get details of a specific department in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'departmentId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the department.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Department retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(DepartmentPayloadSchema),
                            example: {
                                success: true,
                                message: 'Department retrieved successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    name: 'Engineering',
                                    createdAt: '2026-01-01T12:00:00Z',
                                    updatedAt: '2026-06-01T12:00:00Z'
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
                    description: 'Department not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Department not found.'
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
            tags: [DEPARTMENT_TAG],
            summary: 'Update Department',
            operationId: 'updateDepartment',
            description: 'Updates details of an existing department in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'departmentId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the department.',
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
                        schema: UpdateDepartmentRequestSchema,
                        example: {
                            name: 'Software Engineering'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Department updated successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(DepartmentPayloadSchema),
                            example: {
                                success: true,
                                message: 'Department updated successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    name: 'Software Engineering',
                                    createdAt: '2026-01-01T12:00:00Z',
                                    updatedAt: '2026-06-01T12:00:00Z'
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
                                        field: 'name',
                                        message: 'Department name must be at least 3 characters.'
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
                    description: 'Department not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Department not found.'
                            }
                        }
                    }
                },
                409: {
                    description: 'Conflict. Department name already exists.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Department name already exists in this organization.'
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
        delete: {
            tags: [DEPARTMENT_TAG],
            summary: 'Delete Department',
            operationId: 'deleteDepartment',
            description: 'Soft deletes a department in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'departmentId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the department.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Department deleted successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(DeleteDepartmentPayloadSchema),
                            example: {
                                success: true,
                                message: 'Department deleted successfully.',
                                data: null
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
                    description: 'Department not found.',
                    content: {
                        'application/json': {
                            schema: errorResponseSchema(),
                            example: {
                                success: false,
                                message: 'Department not found.'
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
