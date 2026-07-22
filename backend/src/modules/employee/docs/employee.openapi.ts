import {
    successResponseSchema,
    errorResponseSchema,
    validationErrorResponseSchema
} from '#docs/openapi.response.js';

import {
    CreateEmployeeRequestSchema,
    UpdateEmployeeRequestSchema
} from './employee.openapi.request.js';

import {
    EmployeePayloadSchema,
    EmployeeListPayloadSchema,
    DeleteEmployeePayloadSchema
} from './employee.openapi.response.js';


/**
 * ------------------------------------------------------------------
 * Employee Tag
 * ------------------------------------------------------------------
 */

const EMPLOYEE_TAG = 'Employee';


/**
 * ------------------------------------------------------------------
 * Employee Paths (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 */

export const employeePaths = {
    '/employees': {
        get: {
            tags: [EMPLOYEE_TAG],
            summary: 'Get employees list',
            operationId: 'getEmployees',
            description: 'Get list of active employees for the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Employees retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(EmployeeListPayloadSchema),
                            example: {
                                success: true,
                                message: 'Employees retrieved successfully.',
                                data: [
                                    {
                                        id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                        organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                        departmentId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                        employeeNumber: 'EMP-2026-0001',
                                        firstName: 'John',
                                        middleName: 'Alexander',
                                        lastName: 'Doe',
                                        nameExtension: null,
                                        jobTitle: 'Software Engineer',
                                        employmentStatus: 'regular',
                                        hireDate: '2026-01-15T00:00:00.000Z',
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
            tags: [EMPLOYEE_TAG],
            summary: 'Create Employee',
            operationId: 'createEmployee',
            description: 'Creates a new employee in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: CreateEmployeeRequestSchema,
                        example: {
                            firstName: 'John',
                            middleName: 'Alexander',
                            lastName: 'Doe',
                            nameExtension: null,
                            jobTitle: 'Software Engineer',
                            employmentStatus: 'regular',
                            hireDate: '2026-01-15T00:00:00.000Z',
                            departmentId: '3b4c5d6e-7f8a-9012-bcde-f34567890123'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Employee created successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(EmployeePayloadSchema),
                            example: {
                                success: true,
                                message: 'Employee created successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    departmentId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    employeeNumber: 'EMP-2026-0001',
                                    firstName: 'John',
                                    middleName: 'Alexander',
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
                                        field: 'firstName',
                                        message: 'First name must be at least 1 character.'
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
    '/employees/{employeeId}': {
        get: {
            tags: [EMPLOYEE_TAG],
            summary: 'Get Employee by ID',
            operationId: 'getEmployeeById',
            description: 'Get details of a specific employee in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'employeeId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the employee.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Employee retrieved successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(EmployeePayloadSchema),
                            example: {
                                success: true,
                                message: 'Employee retrieved successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    departmentId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    employeeNumber: 'EMP-2026-0001',
                                    firstName: 'John',
                                    middleName: 'Alexander',
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
                    description: 'Employee not found.',
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
            tags: [EMPLOYEE_TAG],
            summary: 'Update Employee',
            operationId: 'updateEmployee',
            description: 'Updates details of a specific employee in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'employeeId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the employee.',
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
                        schema: UpdateEmployeeRequestSchema,
                        example: {
                            jobTitle: 'Senior Software Engineer',
                            employmentStatus: 'regular'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Employee updated successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(EmployeePayloadSchema),
                            example: {
                                success: true,
                                message: 'Employee updated successfully.',
                                data: {
                                    id: '1a2b3c4d-5e6f-7890-abcd-ef1234567890',
                                    organizationId: '8a1b2c3d-4e5f-6789-abcd-ef0123456789',
                                    departmentId: '3b4c5d6e-7f8a-9012-bcde-f34567890123',
                                    employeeNumber: 'EMP-2026-0001',
                                    firstName: 'John',
                                    middleName: 'Alexander',
                                    lastName: 'Doe',
                                    nameExtension: null,
                                    jobTitle: 'Senior Software Engineer',
                                    employmentStatus: 'regular',
                                    hireDate: '2026-01-15T00:00:00.000Z',
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
                                        field: 'jobTitle',
                                        message: 'Job title is required.'
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
                    description: 'Employee or Department not found.',
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
            tags: [EMPLOYEE_TAG],
            summary: 'Delete Employee',
            operationId: 'deleteEmployee',
            description: 'Soft deletes a specific employee in the authenticated user\'s organization.',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'employeeId',
                    in: 'path',
                    required: true,
                    description: 'The unique identifier of the employee.',
                    schema: {
                        type: 'string',
                        format: 'uuid'
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Employee deleted successfully.',
                    content: {
                        'application/json': {
                            schema: successResponseSchema(DeleteEmployeePayloadSchema),
                            example: {
                                success: true,
                                message: 'Employee deleted successfully.',
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
                    description: 'Employee not found.',
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
