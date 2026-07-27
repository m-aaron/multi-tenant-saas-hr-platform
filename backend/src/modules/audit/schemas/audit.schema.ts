import { z } from 'zod';

import {
    AUDIT_ACTIONS,
    AUDIT_ENTITIES,
    type AuditAction,
    type AuditEntity,
} from '../constants/audit.constant.js';


const auditActionSchema = z.enum(
    Object.values(AUDIT_ACTIONS) as [AuditAction, ...AuditAction[]],
    {
        message: 'Invalid audit action.',
    },
);

const auditEntitySchema = z.enum(
    Object.values(AUDIT_ENTITIES) as [AuditEntity, ...AuditEntity[]],
    {
        message: 'Invalid audit entity type.',
    },
);


export const createAuditLogSchema = z.object({
    organizationId: z
        .uuid('Invalid organization ID.'),

    actorId: z
        .uuid('Invalid actor ID.')
        .optional()
        .nullable(),

    action: auditActionSchema,

    entity: auditEntitySchema,

    entityId: z
        .uuid('Invalid entity ID.'),

    metadata: z
        .record(z.string(), z.unknown())
        .default({}),
});


export const listAuditLogsQuerySchema = z.object({
    page: z.coerce
        .number()
        .int('Page must be an integer.')
        .min(1, 'Page must be at least 1.')
        .default(1),

    limit: z.coerce
        .number()
        .int('Limit must be an integer.')
        .min(1, 'Limit must be at least 1.')
        .max(100, 'Limit must not exceed 100.')
        .default(20),
});


export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
