/**
 * ------------------------------------------------------------------
 * User Response Payload Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These schemas represent ONLY the payload stored inside
 * ApiSuccessResponse<T>.
 *
 * The standard API response envelope (success, message, data)
 * is generated globally by docs/openapi.response.ts.
 */

import { USER_STATUSES } from '#modules/user/constants/user.constant.js';

export const UserPayloadSchema = {
    type: 'object',
    required: [
        'id',
        'employeeId',
        'organizationId',
        'roleId',
        'email',
        'status',
        'createdAt',
        'updatedAt'
    ],
    properties: {
        id: {
            type: 'string',
            format: 'uuid',
            description: 'User unique identifier.'
        },
        employeeId: {
            type: 'string',
            format: 'uuid',
            description: 'Employee unique identifier.'
        },
        organizationId: {
            type: 'string',
            format: 'uuid',
            description: 'Organization unique identifier.'
        },
        roleId: {
            type: 'string',
            format: 'uuid',
            description: 'Role unique identifier.'
        },
        email: {
            type: 'string',
            format: 'email',
            description: 'User email address.'
        },
        status: {
            type: 'string',
            enum: USER_STATUSES,
            description: 'User account status.'
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    }
};

export const UserListPayloadSchema = {
    type: 'array',
    items: UserPayloadSchema,
    description: 'List of users.'
};
