/**
 * ------------------------------------------------------------------
 * Department Response Payload Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These schemas represent ONLY the payload stored inside
 * ApiSuccessResponse<T>.
 *
 * The standard API response envelope (success, message, data)
 * is generated globally by docs/openapi.response.ts.
 */

export const DepartmentPayloadSchema = {
    type: 'object',
    required: ['id', 'organizationId', 'name', 'createdAt', 'updatedAt'],
    properties: {
        id: {
            type: 'string',
            format: 'uuid',
            description: 'Department unique identifier.'
        },
        organizationId: {
            type: 'string',
            format: 'uuid',
            description: 'Organization unique identifier.'
        },
        name: {
            type: 'string',
            description: 'Department name.'
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

export const DepartmentListPayloadSchema = {
    type: 'array',
    items: DepartmentPayloadSchema,
    description: 'List of departments.'
};

export const DeleteDepartmentPayloadSchema = {
    type: 'null' as const
};
