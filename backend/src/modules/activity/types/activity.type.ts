import type { PoolClient } from 'pg';

import type { ActivityEvent } from '../constants/activity.constant.js';

export type ActivityLogMetadata = Record<string, unknown>;

export interface ActivityLogRow {
    id: string;
    organizationId: string;
    actorId: string | null;
    eventType: ActivityEvent;
    metadata: ActivityLogMetadata;
    createdAt: Date;
}

export interface PaginatedActivityLogs {
    items: ActivityLogRow[];
    page: number;
    limit: number;
    total: number;
}

/** Shared context when recording activity from other module services. */
export type ActivityLogWriteContext = {
    organizationId: string;
    actorId?: string | null;
    client?: PoolClient;
};
