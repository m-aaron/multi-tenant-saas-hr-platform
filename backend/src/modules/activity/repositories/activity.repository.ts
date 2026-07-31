import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

import type { CreateActivityLogInput, ListActivityLogsQuery } from '../schemas/activity.schema.js';
import type { ActivityLogRow, PaginatedActivityLogs } from '../types/activity.type.js';


function mapActivityLogRow(row: {
    id: string;
    organization_id: string;
    actor_id: string | null;
    event_type: string;
    metadata: ActivityLogMetadata;
    created_at: Date;
}): ActivityLogRow {
    
    return {
        id: row.id,
        organizationId: row.organization_id,
        actorId: row.actor_id,
        eventType: row.event_type as ActivityLogRow['eventType'],
        metadata: row.metadata,
        createdAt: row.created_at,
    };
}

type ActivityLogMetadata = ActivityLogRow['metadata'];


// This function inserts a new activity log record and returns the created row.
export async function insertActivityLog(
    client: PoolClient,
    input: CreateActivityLogInput,
): Promise<ActivityLogRow> {
    
    const activityLogId = generateUuid();

    const query = `
        INSERT INTO activity_logs (
            id,
            organization_id,
            actor_id,
            event_type,
            metadata
        )
        VALUES ($1, $2, $3, $4, $5::jsonb)
        RETURNING
            id,
            organization_id,
            actor_id,
            event_type,
            metadata,
            created_at
    `;

    const values = [
        activityLogId,
        input.organizationId,
        input.actorId ?? null,
        input.eventType,
        JSON.stringify(input.metadata),
    ];

    const result = await client.query(query, values);
    const row = result.rows[0];

    return mapActivityLogRow(row);
}


// This function finds activity logs for an organization with page-based pagination.
export async function findActivityLogsByOrganizationId(
    client: PoolClient,
    organizationId: string,
    query: ListActivityLogsQuery,
): Promise<PaginatedActivityLogs> {
    
    const rawPage = Number(query?.page);
    const rawLimit = Number(query?.limit);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.floor(rawLimit) : 20;
    const offset = (page - 1) * limit;

    const listQuery = `
        SELECT
            id,
            organization_id,
            actor_id,
            event_type,
            metadata,
            created_at,
            COUNT(*) OVER() AS total_count
        FROM activity_logs
        WHERE organization_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3
    `;

    const values = [
        organizationId,
        limit,
        offset,
    ];

    const result = await client.query(listQuery, values);

    const total = result.rows.length > 0
        ? Number(result.rows[0].total_count)
        : 0;

    return {
        items: result.rows.map((row) => mapActivityLogRow(row)),
        page,
        limit,
        total,
    };
}


// This function finds an activity log in the database by its ID and organization.
export async function findActivityLogById(
    client: PoolClient,
    organizationId: string,
    id: string,
): Promise<ActivityLogRow | null> {
    
    const query = `
        SELECT
            id,
            organization_id,
            actor_id,
            event_type,
            metadata,
            created_at
        FROM activity_logs
        WHERE
            id = $1
            AND organization_id = $2
        LIMIT 1
    `;

    const values = [id, organizationId];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
        return null;
    }

    return mapActivityLogRow(result.rows[0]);
}
