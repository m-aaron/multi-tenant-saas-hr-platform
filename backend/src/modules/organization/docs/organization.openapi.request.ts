export const UpdateOrganizationRequestSchema = {
    type: 'object',
    required: ['organizationName'],
    properties: {
        organizationName: {
            type: 'string',
            minLength: 3,
            description: 'Organization name.',
        }
    },
};