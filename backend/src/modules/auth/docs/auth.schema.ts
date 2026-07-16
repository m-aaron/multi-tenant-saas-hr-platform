/**
 * ------------------------------------------------------------------
 * Authentication Request Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These are documentation-only JSON Schema objects that mirror the
 * runtime Zod schemas in ../schemas/*.  They are consumed exclusively
 * by auth.openapi.ts to describe request bodies.
 */


export const RegisterOrganizationRequestSchema = {
    type: 'object',
    required: [
        'organizationName',
        'organizationSlug',
        'ownerEmail',
        'password',
        'firstName',
        'lastName',
    ],
    properties: {
        organizationName: {
            type: 'string',
            minLength: 3,
            maxLength: 255,
            description: 'Display name of the organization.',
        },
        organizationSlug: {
            type: 'string',
            minLength: 3,
            maxLength: 100,
            pattern: '^[a-z0-9-]+$',
            description:
                'URL-safe slug (lowercase letters, numbers, hyphens only).',
        },
        ownerEmail: {
            type: 'string',
            format: 'email',
            description: 'Email address for the organization owner.',
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 100,
            description: 'Password (min 8 characters).',
        },
        firstName: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Owner first name.',
        },
        middleName: {
            type: 'string',
            maxLength: 100,
            description: 'Owner middle name (optional).',
        },
        lastName: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Owner last name.',
        },
        nameExtension: {
            type: 'string',
            maxLength: 20,
            description: 'Name suffix, e.g. "Jr.", "III" (optional).',
        },
    },
};


export const LoginRequestSchema = {
    type: 'object',
    required: ['organizationSlug', 'email', 'password'],
    properties: {
        organizationSlug: {
            type: 'string',
            minLength: 1,
            description: 'Slug of the target organization.',
        },
        email: {
            type: 'string',
            format: 'email',
            description: 'User email address.',
        },
        password: {
            type: 'string',
            minLength: 1,
            description: 'User password.',
        },
    },
};


export const RefreshTokenRequestSchema = {
    type: 'object',
    required: ['refreshToken'],
    properties: {
        refreshToken: {
            type: 'string',
            minLength: 1,
            description: 'A valid refresh token.',
        },
    },
};


export const LogoutRequestSchema = {
    type: 'object',
    required: ['refreshToken'],
    properties: {
        refreshToken: {
            type: 'string',
            minLength: 1,
            description: 'The refresh token of the session to revoke.',
        },
    },
};