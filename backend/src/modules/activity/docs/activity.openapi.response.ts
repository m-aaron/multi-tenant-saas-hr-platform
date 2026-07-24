/**
 * ------------------------------------------------------------------
 * Activity Log Response Payload Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These schemas represent ONLY the payload stored inside
 * ApiSuccessResponse<T>.
 *
 * The standard API response envelope (success, message, data)
 * is generated globally by docs/openapi.response.ts.
 */

import { ACTIVITY_EVENTS } from '../constants/activity.constant.js';


// All valid activity event type values.
const activityEventEnum = Object.values(ACTIVITY_EVENTS) as string[];


// Single activity log row payload.
export const ActivityLogPayloadSchema = {
    type: 'object',
    required: ['id', 'organizationId', 'actorId', 'eventType', 'metadata', 'createdAt'],
    properties: {
        id: {
            type: 'string',
            format: 'uuid',
            description: 'Activity log unique identifier.',
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
            description: 'The user who performed the action. Null for system-initiated events.',
        },
        eventType: {
            type: 'string',
            enum: activityEventEnum,
            description: 'The type of business event that was recorded.',
        },
        metadata: {
            type: 'object',
            additionalProperties: true,
            description: 'Event-specific contextual data (e.g. name, userId, departmentId).',
        },
        createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Timestamp when the event was recorded.',
        },
    },
};


// Paginated list of activity logs payload.
export const PaginatedActivityLogsPayloadSchema = {
    type: 'object',
    required: ['items', 'page', 'limit', 'total'],
    properties: {
        items: {
            type: 'array',
            items: ActivityLogPayloadSchema,
            description: 'Activity log entries for the current page.',
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
            description: 'Total number of activity log entries across all pages.',
        },
    },
};
