/**
 * Builds the standard API success response schema (OpenAPI 3.1.0).
 *
 * {
 *   success: true,
 *   message: "...",
 *   data: ...
 * }
 */
export function successResponseSchema(
    dataSchema: Record<string, unknown>,
) {
    return {
        type: 'object',
        required: ['success', 'message', 'data'],
        properties: {
            success: { 
                type: 'boolean', 
                enum: [true] 
            },

            message: { type: 'string' },
            
            data: dataSchema,
        },
    };
}


/**
 * Builds the standard API error response schema (OpenAPI 3.1.0).
 *
 * {
 *   success: false,
 *   message: "..."
 * }
 */
export function errorResponseSchema() {
    return {
        type: 'object',
        required: ['success', 'message'],
        properties: {
            success: { 
                type: 'boolean', 
                enum: [false] 
            },

            message: { type: 'string' },
        },
    };
}


/**
 * Builds the validation error response schema (OpenAPI 3.1.0).
 *
 * {
 *   success: false,
 *   message: "Validation failed.",
 *   errors: [{ field: "...", message: "..." }]
 * }
 */
export function validationErrorResponseSchema() {
    return {
        type: 'object',
        required: ['success', 'message'],
        properties: {
            success: { 
                type: 'boolean', 
                enum: [false] 
            },

            message: { type: 'string' },

            errors: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['field', 'message'],
                    properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    };
}