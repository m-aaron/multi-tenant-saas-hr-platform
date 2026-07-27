// Query parameters for listing audit logs (GET /audits).
export const ListAuditLogsQueryParams = [
    {
        name: 'page',
        in: 'query',
        required: false,
        description: 'Page number to retrieve. Defaults to 1.',
        schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
        },
    },
    {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Number of audit log entries per page. Defaults to 20. Maximum is 100.',
        schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
        },
    },
];
