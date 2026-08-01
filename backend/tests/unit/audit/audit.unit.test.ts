import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';

import { mockDb } from '#tests/mocks/database.mock.js';

// ---------------------------------------------------------------------------
// Module Mocks — hoisted by Vitest
// ---------------------------------------------------------------------------

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#databases/transaction.js', () => ({
    withTransaction: vi.fn((cb: (client: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock('#modules/audit/repositories/audit.repository.js', () => ({
    insertAuditLog: vi.fn(),
    findAuditLogsByOrganizationId: vi.fn(),
    findAuditLogById: vi.fn(),
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import { AuditLogService, getAuditLogs, getAuditLogById } from '#modules/audit/services/audit.service.js';
import {
    insertAuditLog,
    findAuditLogsByOrganizationId,
    findAuditLogById,
} from '#modules/audit/repositories/audit.repository.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '#modules/audit/constants/audit.constant.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_AUDIT_LOG = {
    id: 'audit-123',
    organizationId: 'org-123',
    actorId: 'user-123',
    action: AUDIT_ACTIONS.CREATED,
    entity: AUDIT_ENTITIES.DEPARTMENT,
    entityId: 'dept-123',
    metadata: { departmentId: 'dept-123', name: 'Engineering' },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const MOCK_PAGINATED_AUDIT_LOGS = {
    items: [MOCK_AUDIT_LOG],
    page: 1,
    limit: 10,
    total: 1,
};

const MOCK_QUERY = {
    page: 1,
    limit: 10,
};

const MOCK_WRITE_CONTEXT = {
    organizationId: 'org-123',
    actorId: 'user-123',
};

const mockClient = {} as PoolClient;

// ---------------------------------------------------------------------------
// Tests: getAuditLogs()
// ---------------------------------------------------------------------------

describe('getAuditLogs()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid organization ID and query parameters are provided', () => {
        it('returns paginated audit logs for an organization', async () => {
            vi.mocked(findAuditLogsByOrganizationId).mockResolvedValueOnce(MOCK_PAGINATED_AUDIT_LOGS as never);

            const result = await getAuditLogs('org-123', MOCK_QUERY);

            expect(result).toEqual(MOCK_PAGINATED_AUDIT_LOGS);
            expect(findAuditLogsByOrganizationId).toHaveBeenCalledWith(
                expect.anything(),
                'org-123',
                MOCK_QUERY,
            );
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failures', async () => {
            vi.mocked(findAuditLogsByOrganizationId).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(getAuditLogs('org-123', MOCK_QUERY)).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getAuditLogById()
// ---------------------------------------------------------------------------

describe('getAuditLogById()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid audit log ID and organization ID are provided', () => {
        it('returns a matching audit log record', async () => {
            vi.mocked(findAuditLogById).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            const result = await getAuditLogById('org-123', 'audit-123');

            expect(result).toEqual(MOCK_AUDIT_LOG);
            expect(findAuditLogById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'audit-123');
        });
    });

    describe('when the audit log is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findAuditLogById).mockResolvedValueOnce(null);

            await expect(getAuditLogById('org-123', 'nonexistent')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failures', async () => {
            vi.mocked(findAuditLogById).mockRejectedValueOnce(new Error('Database failure'));

            await expect(getAuditLogById('org-123', 'audit-123')).rejects.toThrow('Database failure');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: AuditLogService helpers
// ---------------------------------------------------------------------------

describe('AuditLogService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when called with an existing database client in context', () => {
        it('uses the provided client for organization registration audit logs', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            const result = await AuditLogService.logOrganizationRegistered(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { organizationId: 'org-123', name: 'Acme Corp', slug: 'acme-corp' },
            );

            expect(result).toEqual(MOCK_AUDIT_LOG);
            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                action: AUDIT_ACTIONS.REGISTERED,
                entity: AUDIT_ENTITIES.ORGANIZATION,
                entityId: 'org-123',
                metadata: { organizationId: 'org-123', name: 'Acme Corp', slug: 'acme-corp' },
            });
        });
    });

    describe('organization event loggers', () => {
        it('logs organization registered entries', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logOrganizationRegistered(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { organizationId: 'org-123', name: 'Acme Corp', slug: 'acme-corp' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.REGISTERED,
                entity: AUDIT_ENTITIES.ORGANIZATION,
            }));
        });

        it('logs organization updated entries', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logOrganizationUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { name: 'Acme Corp Updated' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.UPDATED,
                entity: AUDIT_ENTITIES.ORGANIZATION,
            }));
        });
    });

    describe('department event loggers', () => {
        it('logs logDepartmentCreated with department created audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logDepartmentCreated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { departmentId: 'dept-123', name: 'Engineering' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.CREATED,
                entity: AUDIT_ENTITIES.DEPARTMENT,
            }));
        });

        it('logs logDepartmentUpdated with department updated audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logDepartmentUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { departmentId: 'dept-123', name: 'Software Engineering' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.UPDATED,
                entity: AUDIT_ENTITIES.DEPARTMENT,
            }));
        });

        it('logs logDepartmentArchived with department archived audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logDepartmentArchived(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { departmentId: 'dept-123', name: 'Engineering' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.ARCHIVED,
                entity: AUDIT_ENTITIES.DEPARTMENT,
            }));
        });
    });

    describe('employee event loggers', () => {
        it('logs logEmployeeCreated with employee created audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logEmployeeCreated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { employeeId: 'emp-123', employeeNumber: 'EMP-000001', firstName: 'Jane', lastName: 'Doe' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.CREATED,
                entity: AUDIT_ENTITIES.EMPLOYEE,
            }));
        });

        it('logs logEmployeeUpdated with employee updated audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logEmployeeUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { employeeId: 'emp-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.UPDATED,
                entity: AUDIT_ENTITIES.EMPLOYEE,
            }));
        });

        it('logs logEmployeeArchived with employee archived audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logEmployeeArchived(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { employeeId: 'emp-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.ARCHIVED,
                entity: AUDIT_ENTITIES.EMPLOYEE,
            }));
        });
    });

    describe('user event loggers', () => {
        it('logs logUserCreated with user created audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logUserCreated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123', email: 'user@example.com' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.CREATED,
                entity: AUDIT_ENTITIES.USER,
            }));
        });

        it('logs logUserUpdated with user updated audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logUserUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.UPDATED,
                entity: AUDIT_ENTITIES.USER,
            }));
        });

        it('logs logUserInvited with user invited audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logUserInvited(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123', email: 'user@example.com' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.INVITED,
                entity: AUDIT_ENTITIES.USER,
            }));
        });

        it('logs logUserReactivated with user reactivated audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logUserReactivated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.REACTIVATED,
                entity: AUDIT_ENTITIES.USER,
            }));
        });
    });

    describe('profile event loggers', () => {
        it('logs logProfileCreated with profile created audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logProfileCreated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.CREATED,
                entity: AUDIT_ENTITIES.PROFILE,
            }));
        });

        it('logs logProfileUpdated with profile updated audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logProfileUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.UPDATED,
                entity: AUDIT_ENTITIES.PROFILE,
            }));
        });

        it('logs logProfilePasswordChanged with profile password changed audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logProfilePasswordChanged(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.PASSWORD_CHANGED,
                entity: AUDIT_ENTITIES.PROFILE,
            }));
        });
    });

    describe('auth event loggers', () => {
        it('logs logAuthLogin with login audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logAuthLogin(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123', email: 'user@example.com' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.LOGIN,
                entity: AUDIT_ENTITIES.SESSION,
            }));
        });

        describe('when called without a client in context', () => {
        it('wraps logging in a transaction for auth login failure audit logs', async () => {
            const expectedAuditLog = {
                ...MOCK_AUDIT_LOG,
                actorId: null,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                entity: AUDIT_ENTITIES.SESSION,
                entityId: 'org-123',
                metadata: { email: 'user@example.com', reason: 'Invalid password.' },
            };

            vi.mocked(insertAuditLog).mockResolvedValueOnce(expectedAuditLog as never);

            const result = await AuditLogService.logAuthLoginFailed(
                { organizationId: 'org-123', actorId: null },
                { email: 'user@example.com', reason: 'Invalid password.' },
            );

            expect(result).toEqual(expectedAuditLog);
            expect(insertAuditLog).toHaveBeenCalledWith(expect.anything(), {
                organizationId: 'org-123',
                actorId: null,
                action: AUDIT_ACTIONS.LOGIN_FAILED,
                entity: AUDIT_ENTITIES.SESSION,
                entityId: 'org-123',
                metadata: { email: 'user@example.com', reason: 'Invalid password.' },
            });
        });
    });

        it('logs logAuthLogout with logout audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logAuthLogout(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.LOGOUT,
                entity: AUDIT_ENTITIES.SESSION,
            }));
        });

        it('logs logAuthLogoutAll with logout_all audit event', async () => {
            vi.mocked(insertAuditLog).mockResolvedValueOnce(MOCK_AUDIT_LOG as never);

            await AuditLogService.logAuthLogoutAll(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertAuditLog).toHaveBeenCalledWith(mockClient, expect.objectContaining({
                action: AUDIT_ACTIONS.LOGOUT_ALL,
                entity: AUDIT_ENTITIES.SESSION,
            }));
        });
    });
});
