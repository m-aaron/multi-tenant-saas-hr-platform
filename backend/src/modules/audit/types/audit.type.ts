import type { PoolClient } from 'pg';

import type { AuditAction, AuditEntity } from '../constants/audit.constant.js';


export type AuditLogMetadata = Record<string, unknown>;

export interface AuditLogRow {
    id: string;
    organizationId: string;
    actorId: string | null;
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    metadata: AuditLogMetadata;
    createdAt: Date;
}

export interface PaginatedAuditLogs {
    items: AuditLogRow[];
    page: number;
    limit: number;
    total: number;
}

/** Shared context when recording an audit entry from other module services. */
export type AuditLogWriteContext = {
    organizationId: string;
    actorId?: string | null;
    client?: PoolClient;
};