import { authPaths } from '#modules/auth/docs/auth.openapi.js';
import { securitySchemes } from './security.js';

export const openApiDocument = {
    openapi: '3.1.0',

    info: {
        title: 'HR Management Platform API',
        version: '1.0.0',
        description:
            'REST API documentation for the Multi-Tenant HR Management Platform.',
    },

    servers: [
        {
            url: '/api/v1',
            description: 'API v1',
        },
    ],

    tags: [
        {
            name: 'Authentication',
            description:
                'Registration, authentication, token refresh and session management.',
        },
    ],

    components: {
        securitySchemes,
    },

    paths: {
        ...authPaths,
    },
};