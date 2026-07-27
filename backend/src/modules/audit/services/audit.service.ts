import type { PoolClient } from 'pg';

import { withTransaction } from '#databases/transaction.js';

import { NotFoundError } from '#shared/errors/not-found-error.js';

import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../constants/audit.constant.js';

import {
    findAuditLogById,
    findAuditLogsByOrganizationId,
    insertAuditLog,
} from '../repositories/audit.repository.js';

import type {
    CreateAuditLogInput,
    ListAuditLogsQuery,
} from '../schemas/audit.schema.js';
import type {
    AuditLogMetadata,
    AuditLogRow,
    AuditLogWriteContext,
    PaginatedAuditLogs,
} from '../types/audit.type.js';


type WriteAuditLogParams = AuditLogWriteContext & {
    action: CreateAuditLogInput['action'];
    entity: CreateAuditLogInput['entity'];
    entityId: string;
    metadata: AuditLogMetadata;
};


async function createAuditLog(
    input: CreateAuditLogInput,
    client?: PoolClient,
): Promise<AuditLogRow> {

    if (client) {
        return insertAuditLog(client, input);
    }

    return withTransaction((transactionClient) =>
        insertAuditLog(transactionClient, input),
    );
}

async function writeAuditLog(params: WriteAuditLogParams): Promise<AuditLogRow> {

    const { organizationId, actorId, action, entity, entityId, metadata, client } = params;

    return createAuditLog(
        {
            organizationId,
            actorId,
            action,
            entity,
            entityId,
            metadata,
        },
        client,
    );
}


// --- Organization ---

async function logOrganizationRegistered(
    context: AuditLogWriteContext,
    payload: { organizationId: string; name: string; slug: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.REGISTERED,
        entity: AUDIT_ENTITIES.ORGANIZATION,
        entityId: payload.organizationId,
        metadata: payload,
    });
}

async function logOrganizationUpdated(
    context: AuditLogWriteContext,
    payload: { name: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.UPDATED,
        entity: AUDIT_ENTITIES.ORGANIZATION,
        entityId: context.organizationId,
        metadata: payload,
    });
}


// --- Department ---

async function logDepartmentCreated(
    context: AuditLogWriteContext,
    payload: { departmentId: string; name: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.CREATED,
        entity: AUDIT_ENTITIES.DEPARTMENT,
        entityId: payload.departmentId,
        metadata: payload,
    });
}

async function logDepartmentUpdated(
    context: AuditLogWriteContext,
    payload: { departmentId: string; name: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.UPDATED,
        entity: AUDIT_ENTITIES.DEPARTMENT,
        entityId: payload.departmentId,
        metadata: payload,
    });
}

async function logDepartmentArchived(
    context: AuditLogWriteContext,
    payload: { departmentId: string; name: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.ARCHIVED,
        entity: AUDIT_ENTITIES.DEPARTMENT,
        entityId: payload.departmentId,
        metadata: payload,
    });
}


// --- Employee ---

async function logEmployeeCreated(
    context: AuditLogWriteContext,
    payload: {
        employeeId: string;
        employeeNumber: string;
        firstName: string;
        lastName: string;
    },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.CREATED,
        entity: AUDIT_ENTITIES.EMPLOYEE,
        entityId: payload.employeeId,
        metadata: payload,
    });
}

async function logEmployeeUpdated(
    context: AuditLogWriteContext,
    payload: { employeeId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.UPDATED,
        entity: AUDIT_ENTITIES.EMPLOYEE,
        entityId: payload.employeeId,
        metadata: payload,
    });
}

async function logEmployeeArchived(
    context: AuditLogWriteContext,
    payload: { employeeId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.ARCHIVED,
        entity: AUDIT_ENTITIES.EMPLOYEE,
        entityId: payload.employeeId,
        metadata: payload,
    });
}


// --- User ---

async function logUserCreated(
    context: AuditLogWriteContext,
    payload: { userId: string; email: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.CREATED,
        entity: AUDIT_ENTITIES.USER,
        entityId: payload.userId,
        metadata: payload,
    });
}

async function logUserUpdated(
    context: AuditLogWriteContext,
    payload: { userId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.UPDATED,
        entity: AUDIT_ENTITIES.USER,
        entityId: payload.userId,
        metadata: payload,
    });
}

async function logUserInvited(
    context: AuditLogWriteContext,
    payload: { userId: string; email: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.INVITED,
        entity: AUDIT_ENTITIES.USER,
        entityId: payload.userId,
        metadata: payload,
    });
}

async function logUserReactivated(
    context: AuditLogWriteContext,
    payload: { userId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.REACTIVATED,
        entity: AUDIT_ENTITIES.USER,
        entityId: payload.userId,
        metadata: payload,
    });
}


// --- Profile ---

async function logProfileCreated(
    context: AuditLogWriteContext,
    payload: { userId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.CREATED,
        entity: AUDIT_ENTITIES.PROFILE,
        entityId: payload.userId,
        metadata: payload,
    });
}

async function logProfileUpdated(
    context: AuditLogWriteContext,
    payload: { userId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.UPDATED,
        entity: AUDIT_ENTITIES.PROFILE,
        entityId: payload.userId,
        metadata: payload,
    });
}

async function logProfilePasswordChanged(
    context: AuditLogWriteContext,
    payload: { userId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.PASSWORD_CHANGED,
        entity: AUDIT_ENTITIES.PROFILE,
        entityId: payload.userId,
        metadata: payload,
    });
}


// --- Auth ---

async function logAuthLogin(
    context: AuditLogWriteContext,
    payload: { userId: string; email: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.LOGIN,
        entity: AUDIT_ENTITIES.SESSION,
        entityId: payload.userId,
        metadata: payload,
    });
}

async function logAuthLoginFailed(
    context: AuditLogWriteContext,
    payload: { email: string; reason?: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        entity: AUDIT_ENTITIES.SESSION,
        entityId: context.organizationId,
        metadata: payload,
    });
}

async function logAuthLogout(
    context: AuditLogWriteContext,
    payload: { userId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.LOGOUT,
        entity: AUDIT_ENTITIES.SESSION,
        entityId: payload.userId,
        metadata: payload,
    });
}

async function logAuthLogoutAll(
    context: AuditLogWriteContext,
    payload: { userId: string },
): Promise<AuditLogRow> {
    return writeAuditLog({
        ...context,
        action: AUDIT_ACTIONS.LOGOUT_ALL,
        entity: AUDIT_ENTITIES.SESSION,
        entityId: payload.userId,
        metadata: payload,
    });
}


// This service function retrieves paginated audit logs for the user's organization.
export async function getAuditLogs(
    organizationId: string,
    query: ListAuditLogsQuery,
): Promise<PaginatedAuditLogs> {

    return withTransaction((client) =>
        findAuditLogsByOrganizationId(client, organizationId, query),
    );
}


// This service function retrieves an audit log by its ID.
export async function getAuditLogById(
    organizationId: string,
    id: string,
): Promise<AuditLogRow> {

    const result = await withTransaction(async (client) => {

        const auditLog = await findAuditLogById(client, organizationId, id);

        if (!auditLog) {
            throw new NotFoundError('Audit log not found.');
        }

        return auditLog;
    });

    return result;
}


// Central entry point for recording security audit entries from other module services.
export const AuditLogService = {
    logOrganizationRegistered,
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
    logProfileCreated,
    logProfileUpdated,
    logProfilePasswordChanged,
    logAuthLogin,
    logAuthLoginFailed,
    logAuthLogout,
    logAuthLogoutAll,
};
