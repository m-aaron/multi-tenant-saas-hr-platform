/**
 * ------------------------------------------------------------------
 * Organization Response Payload Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These schemas represent ONLY the payload stored inside
 * ApiSuccessResponse<T>.
 *
 * The standard API response envelope
 * (success, message, data)
 * is generated globally by:
 *
 * docs/response.schema.ts
 */


// Payload returned after a organization get successfully.
export const GetOrganizationPayloadSchema = {
    type: 'object',
    required: ['id', 'name', 'slug', 'createdAt', 'updatedAt'],
    properties: {
        id: { 
            type: 'string',
            format: 'uuid'
        },
        
        name: { 
            type: 'string',
            description: 'Organization Name' 
        },

        slug: { 
            type: 'string',
            description: 'Organization Slug' 
        },

        createdAt: { 
            type: 'string',
            format: 'date-time'
        },

        updatedAt: { 
            type: 'string',
            format: 'date-time'
        },
    },
};


// Payload returned after a successful update.
export const UpdateOrganizationPayloadSchema = {
    type: 'object',
    required: ['id', 'name', 'slug', 'createdAt', 'updatedAt'],
    properties: {
        id: { 
            type: 'string',
            format: 'uuid'
        },
        
        name: { 
            type: 'string',
            description: 'Organization Name' 
        },

        slug: { 
            type: 'string',
            description: 'Organization Slug' 
        },

        createdAt: { 
            type: 'string',
            format: 'date-time'
        },

        updatedAt: { 
            type: 'string',
            format: 'date-time'
        },
    },
};