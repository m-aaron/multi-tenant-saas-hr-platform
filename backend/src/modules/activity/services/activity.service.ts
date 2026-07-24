import type { PoolClient } from 'pg';

import { withTransaction } from '#databases/transaction.js';

import { NotFoundError } from '#shared/errors/not-found-error.js';

import { ACTIVITY_EVENTS } from '../constants/activity.constant.js';

import {
    findActivityLogById,
    findActivityLogsByOrganizationId,
    insertActivityLog,
} from '../repositories/activity.repository.js';

import type {
    CreateActivityLogInput,
    ListActivityLogsQuery,
} from '../schemas/activity.schema.js';
import type {
    ActivityLogMetadata,
    ActivityLogRow,
    ActivityLogWriteContext,
    PaginatedActivityLogs,
} from '../types/activity.type.js';


type WriteActivityLogParams = ActivityLogWriteContext & {
    eventType: CreateActivityLogInput['eventType'];
    metadata: ActivityLogMetadata;
};


async function createActivityLog(
    input: CreateActivityLogInput,
    client?: PoolClient,
): Promise<ActivityLogRow> {

    if (client) {
        return insertActivityLog(client, input);
    }

    return withTransaction((transactionClient) =>
        insertActivityLog(transactionClient, input),
    );
}

async function writeActivityLog(params: WriteActivityLogParams): Promise<ActivityLogRow> {
    
    const { organizationId, actorId, eventType, metadata, client } = params;

    return createActivityLog(
        {
            organizationId,
            actorId,
            eventType,
            metadata,
        },
        client,
    );
}


async function logOrganizationUpdated(
    context: ActivityLogWriteContext,
    payload: { name: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.ORGANIZATION_UPDATED,
        metadata: payload,
    });
}

async function logDepartmentCreated(
    context: ActivityLogWriteContext,
    payload: { departmentId: string; name: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.DEPARTMENT_CREATED,
        metadata: payload,
    });
}

async function logDepartmentUpdated(
    context: ActivityLogWriteContext,
    payload: { departmentId: string; name: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.DEPARTMENT_UPDATED,
        metadata: payload,
    });
}

async function logDepartmentArchived(
    context: ActivityLogWriteContext,
    payload: { departmentId: string; name: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.DEPARTMENT_ARCHIVED,
        metadata: payload,
    });
}

async function logEmployeeCreated(
    context: ActivityLogWriteContext,
    payload: {
        employeeId: string;
        employeeNumber: string;
        firstName: string;
        lastName: string;
    },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.EMPLOYEE_CREATED,
        metadata: payload,
    });
}

async function logEmployeeUpdated(
    context: ActivityLogWriteContext,
    payload: { employeeId: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.EMPLOYEE_UPDATED,
        metadata: payload,
    });
}

async function logEmployeeArchived(
    context: ActivityLogWriteContext,
    payload: { employeeId: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.EMPLOYEE_ARCHIVED,
        metadata: payload,
    });
}

async function logUserCreated(
    context: ActivityLogWriteContext,
    payload: { userId: string; email: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.USER_CREATED,
        metadata: payload,
    });
}

async function logUserUpdated(
    context: ActivityLogWriteContext,
    payload: { userId: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.USER_UPDATED,
        metadata: payload,
    });
}

async function logUserInvited(
    context: ActivityLogWriteContext,
    payload: { userId: string; email: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.USER_INVITED,
        metadata: payload,
    });
}

async function logUserReactivated(
    context: ActivityLogWriteContext,
    payload: { userId: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.USER_REACTIVATED,
        metadata: payload,
    });
}

async function logProfileUpdated(
    context: ActivityLogWriteContext,
    payload: { userId: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.PROFILE_UPDATED,
        metadata: payload,
    });
}

async function logProfilePasswordChanged(
    context: ActivityLogWriteContext,
    payload: { userId: string },
): Promise<ActivityLogRow> {
    return writeActivityLog({
        ...context,
        eventType: ACTIVITY_EVENTS.PROFILE_PASSWORD_CHANGED,
        metadata: payload,
    });
}


// This service function retrieves paginated activity logs for the user's organization.
export async function getActivityLogs(
    organizationId: string,
    query: ListActivityLogsQuery,
): Promise<PaginatedActivityLogs> {
    
    return withTransaction((client) =>
        findActivityLogsByOrganizationId(client, organizationId, query),
    );
}


// This service function retrieves an activity log by its ID.
export async function getActivityLogById(
    organizationId: string,
    id: string,
): Promise<ActivityLogRow> {
    
    const result = await withTransaction(async (client) => {
        
        const activityLog = await findActivityLogById(client, organizationId, id);

        if (!activityLog) {
            throw new NotFoundError('Activity log not found.');
        }

        return activityLog;
    });

    return result;
}


// Central entry point for recording business activity from other module services.
export const ActivityLogService = {
    logOrganizationUpdated,
    logDepartmentCreated,
    logDepartmentUpdated,
    logDepartmentArchived,
    logEmployeeCreated,
    logEmployeeUpdated,
    logEmployeeArchived,
    logUserCreated,
    logUserUpdated,
    logUserInvited,
    logUserReactivated,
    logProfileUpdated,
    logProfilePasswordChanged,
};
