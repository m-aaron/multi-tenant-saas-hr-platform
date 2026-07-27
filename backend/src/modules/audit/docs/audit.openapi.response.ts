/**
 * ------------------------------------------------------------------
 * Audit Log Response Payload Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These schemas represent ONLY the payload stored inside
 * ApiSuccessResponse<T>.
 *
 * The standard API response envelope (success, message, data)
 * is generated globally by docs/openapi.response.ts.
 */

import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../constants/audit.constant.js';


// All valid audit action and entity values.
const auditActionEnum = Object.values(AUDIT_ACTIONS) as string[];
const auditEntityEnum = Object.values(AUDIT_ENTITIES) as string[];


// Single audit log row payload.
export const AuditLogPayloadSchema = {
    type: 'object',
    required: ['id', 'organizationId', 'actorId', 'action', 'entity', 'entityId', 'metadata', 'createdAt'],
    properties: {
        id: {
            type: 'string',
            format: 'uuid',
            description: 'Audit log unique identifier.',
        },
        organizationId: {
            type: 'string',
            format: 'uuid',
            description: 'Organization this log belongs to.',
        },
        actorId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'The user who performed the action. Null for system or unauthenticated events.',
        },
        action: {
            type: 'string',
            enum: auditActionEnum,
            description: 'The audit action that was executed.',
        },
        entity: {
            type: 'string',
            enum: auditEntityEnum,
            description: 'The target entity type affected by the action.',
        },
        entityId: {
            type: 'string',
            format: 'uuid',
            description: 'The unique identifier of the target entity.',
        },
        metadata: {
            type: 'object',
            additionalProperties: true,
            description: 'Audit log metadata containing action-specific context.',
        },
        createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the audit log entry was created.',
        },
    },
};


// Paginated list of audit logs payload.
export const PaginatedAuditLogsPayloadSchema = {
    type: 'object',
    required: ['items', 'page', 'limit', 'total'],
    properties: {
        items: {
            type: 'array',
            items: AuditLogPayloadSchema,
            description: 'Audit log entries for the current page.',
        },
        page: {
            type: 'integer',
            minimum: 1,
            description: 'Current page number.',
        },
        limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            description: 'Number of items per page.',
        },
        total: {
            type: 'integer',
            minimum: 0,
            description: 'Total number of audit log entries across all pages.',
        },
    },
};
