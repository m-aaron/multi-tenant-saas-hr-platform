/**
 * ------------------------------------------------------------------
 * Authentication Response Payload Schemas (OpenAPI 3.1.0)
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


// Payload returned after a successful organization registration.
// Registration does not return additional data.
export const RegisterOrganizationPayloadSchema = { type: 'null' as const };


// Payload returned after a successful login.
export const LoginPayloadSchema = {
    type: 'object',
    required: ['user', 'tokens'],
    properties: {
        user: {
            type: 'object',
            required: ['id', 'organizationId', 'roleId', 'email'],
            properties: {
                id: { 
                    type: 'string', 
                    format: 'uuid' 
                },

                organizationId: { 
                    type: 'string', 
                    format: 'uuid' 
                },

                employeeId: { 
                    type: 'string', 
                    format: 'uuid',
                    nullable: true
                },

                roleId: { 
                    type: 'string', 
                    format: 'uuid' 
                },

                email: { 
                    type: 'string', 
                    format: 'email' 
                }
            },
        },
        tokens: {
            type: 'object',
            required: ['accessToken', 'refreshToken'],
            properties: {
                accessToken: { 
                    type: 'string',
                    description: 'JWT Access Token' 
                },
                refreshToken: { 
                    type: 'string',
                    description: 'JWT Refresh Token' 
                }
            },
        },
    },
};


// Payload returned after a successful token refresh.
export const RefreshTokenPayloadSchema = {
    type: 'object',
    required: ['accessToken', 'refreshToken'],
    properties: {
        accessToken: { 
            type: 'string',
            description: 'JWT Access Token' 
        },
        
        refreshToken: { 
            type: 'string',
            description: 'JWT Refresh Token' 
        },
    },
};


// Payload returned after a successful logout.
// Logout does not return additional data.
export const LogoutPayloadSchema = { type: 'null' as const };


// Payload returned after logging out from all sessions.
// Logout All does not return additional data.
export const LogoutAllSessionsPayloadSchema = { type: 'null' as const };