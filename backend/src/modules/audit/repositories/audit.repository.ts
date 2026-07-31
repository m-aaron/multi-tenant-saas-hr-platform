import type { PoolClient } from 'pg';

import { generateUuid } from '#shared/utils/uuid.util.js';

import type { CreateAuditLogInput, ListAuditLogsQuery } from '../schemas/audit.schema.js';
import type { AuditLogRow, PaginatedAuditLogs } from '../types/audit.type.js';


type AuditLogMetadata = AuditLogRow['metadata'];

function mapAuditLogRow(row: {
    id: string;
    organization_id: string;
    actor_id: string | null;
    action: string;
    entity: string;
    entity_id: string;
    metadata: AuditLogMetadata;
    created_at: Date;
}): AuditLogRow {
    return {
        id: row.id,
        organizationId: row.organization_id,
        actorId: row.actor_id,
        action: row.action as AuditLogRow['action'],
        entity: row.entity as AuditLogRow['entity'],
        entityId: row.entity_id,
        metadata: row.metadata,
        createdAt: row.created_at,
    };
}


// This function inserts a new audit log record and returns the created row.
export async function insertAuditLog(
    client: PoolClient,
    input: CreateAuditLogInput,
): Promise<AuditLogRow> {

    const auditLogId = generateUuid();

    const query = `
        INSERT INTO audit_logs (
            id,
            organization_id,
            actor_id,
            action,
            entity,
            entity_id,
            metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        RETURNING
            id,
            organization_id,
            actor_id,
            action,
            entity,
            entity_id,
            metadata,
            created_at
    `;

    const values = [
        auditLogId,
        input.organizationId,
        input.actorId ?? null,
        input.action,
        input.entity,
        input.entityId,
        JSON.stringify(input.metadata),
    ];

    const result = await client.query(query, values);
    const row = result.rows[0];

    return mapAuditLogRow(row);
}


// This function finds audit logs for an organization with page-based pagination.
export async function findAuditLogsByOrganizationId(
    client: PoolClient,
    organizationId: string,
    query: ListAuditLogsQuery,
): Promise<PaginatedAuditLogs> {

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
            action,
            entity,
            entity_id,
            metadata,
            created_at,
            COUNT(*) OVER() AS total_count
        FROM audit_logs
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
        items: result.rows.map((row) => mapAuditLogRow(row)),
        page,
        limit,
        total,
    };
}


// This function finds an audit log in the database by its ID and organization.
export async function findAuditLogById(
    client: PoolClient,
    organizationId: string,
    id: string,
): Promise<AuditLogRow | null> {

    const query = `
        SELECT
            id,
            organization_id,
            actor_id,
            action,
            entity,
            entity_id,
            metadata,
            created_at
        FROM audit_logs
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

    return mapAuditLogRow(result.rows[0]);
}
