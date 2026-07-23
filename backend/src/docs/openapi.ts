import { securitySchemes } from './openapi.security.js';

import { authPaths } from '#modules/auth/docs/auth.openapi.js';
import { organizationPaths } from '#modules/organization/docs/organization.openapi.js';
import { departmentPaths } from '#modules/department/docs/department.openapi.js';
import { employeePaths } from '#modules/employee/docs/employee.openapi.js';
import { userPaths } from '#modules/user/docs/user.openapi.js';
import { profilePaths } from '#modules/profile/docs/profile.openapi.js';


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
        {
            name: 'Organization',
            description: 'Organization settings and profile management.',
        },
        {
            name: 'Department',
            description: 'Department settings and management.',
        },
        {
            name: 'Employee',
            description: 'Employee management and profile operations.',
        },
        {
            name: 'User',
            description: 'User account creation, invitations, updates and status management.',
        },
        {
            name: 'Profile',
            description: 'Authenticated user profile retrieval, updates and password management.',
        },
    ],

    components: {
        securitySchemes,
    },

    paths: {
        ...authPaths,
        ...organizationPaths,
        ...departmentPaths,
        ...employeePaths,
        ...userPaths,
        ...profilePaths,
    },
};