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

vi.mock('#modules/activity/repositories/activity.repository.js', () => ({
    findActivityLogById: vi.fn(),
    findActivityLogsByOrganizationId: vi.fn(),
    insertActivityLog: vi.fn(),
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import {
    getActivityLogs,
    getActivityLogById,
    ActivityLogService,
} from '#modules/activity/services/activity.service.js';
import {
    findActivityLogById,
    findActivityLogsByOrganizationId,
    insertActivityLog,
} from '#modules/activity/repositories/activity.repository.js';
import { ACTIVITY_EVENTS } from '#modules/activity/constants/activity.constant.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_ACTIVITY_LOG = {
    id: 'activity-123',
    organizationId: 'org-123',
    actorId: 'user-123',
    eventType: ACTIVITY_EVENTS.ORGANIZATION_UPDATED,
    metadata: { name: 'Acme Corp' },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const MOCK_PAGINATED_LOGS = {
    data: {
        items: [MOCK_ACTIVITY_LOG],
        page: 1,
        limit: 10,
        totalItems: 1,
        total: 1,
    }
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
// Tests: getActivityLogs()
// ---------------------------------------------------------------------------

describe('getActivityLogs()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid organizationId and query parameters are provided', () => {
        it('returns paginated activity logs', async () => {
            vi.mocked(findActivityLogsByOrganizationId).mockResolvedValueOnce(MOCK_PAGINATED_LOGS as never);

            const result = await getActivityLogs('org-123', MOCK_QUERY);

            expect(result).toEqual(MOCK_PAGINATED_LOGS);
            expect(findActivityLogsByOrganizationId).toHaveBeenCalledWith(
                expect.anything(),
                'org-123',
                MOCK_QUERY,
            );
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findActivityLogsByOrganizationId).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(getActivityLogs('org-123', MOCK_QUERY)).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getActivityLogById()
// ---------------------------------------------------------------------------

describe('getActivityLogById()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid activity log ID is provided', () => {
        it('returns matching activity log record', async () => {
            vi.mocked(findActivityLogById).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            const result = await getActivityLogById('org-123', 'activity-123');

            expect(result).toEqual(MOCK_ACTIVITY_LOG);
            expect(findActivityLogById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'activity-123');
        });
    });

    describe('when activity log is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findActivityLogById).mockResolvedValueOnce(null);

            await expect(getActivityLogById('org-123', 'nonexistent')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findActivityLogById).mockRejectedValueOnce(new Error('Database error'));

            await expect(getActivityLogById('org-123', 'activity-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: ActivityLogService helpers
// ---------------------------------------------------------------------------

describe('ActivityLogService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when called with an existing database client in context', () => {
        it('uses the provided client directly without starting a new transaction', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            const result = await ActivityLogService.logOrganizationUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { name: 'Acme Corp' },
            );

            expect(result).toEqual(MOCK_ACTIVITY_LOG);
            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.ORGANIZATION_UPDATED,
                metadata: { name: 'Acme Corp' },
            });
        });
    });

    describe('when called without a client in context', () => {
        it('wraps insertion in withTransaction', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            const result = await ActivityLogService.logOrganizationUpdated(
                MOCK_WRITE_CONTEXT,
                { name: 'Acme Corp' },
            );

            expect(result).toEqual(MOCK_ACTIVITY_LOG);
            expect(insertActivityLog).toHaveBeenCalledWith(expect.anything(), {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.ORGANIZATION_UPDATED,
                metadata: { name: 'Acme Corp' },
            });
        });
    });

    describe('Department event loggers', () => {
        it('logs logDepartmentCreated with DEPARTMENT_CREATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logDepartmentCreated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { departmentId: 'dept-123', name: 'Engineering' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.DEPARTMENT_CREATED,
                metadata: { departmentId: 'dept-123', name: 'Engineering' },
            });
        });

        it('logs logDepartmentUpdated with DEPARTMENT_UPDATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logDepartmentUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { departmentId: 'dept-123', name: 'Software Engineering' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.DEPARTMENT_UPDATED,
                metadata: { departmentId: 'dept-123', name: 'Software Engineering' },
            });
        });

        it('logs logDepartmentArchived with DEPARTMENT_ARCHIVED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logDepartmentArchived(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { departmentId: 'dept-123', name: 'Engineering' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.DEPARTMENT_ARCHIVED,
                metadata: { departmentId: 'dept-123', name: 'Engineering' },
            });
        });
    });

    describe('Employee event loggers', () => {
        it('logs logEmployeeCreated with EMPLOYEE_CREATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            const payload = {
                employeeId: 'emp-123',
                employeeNumber: 'EMP-000001',
                firstName: 'Jane',
                lastName: 'Doe',
            };

            await ActivityLogService.logEmployeeCreated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                payload,
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.EMPLOYEE_CREATED,
                metadata: payload,
            });
        });

        it('logs logEmployeeUpdated with EMPLOYEE_UPDATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logEmployeeUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { employeeId: 'emp-123' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.EMPLOYEE_UPDATED,
                metadata: { employeeId: 'emp-123' },
            });
        });

        it('logs logEmployeeArchived with EMPLOYEE_ARCHIVED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logEmployeeArchived(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { employeeId: 'emp-123' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.EMPLOYEE_ARCHIVED,
                metadata: { employeeId: 'emp-123' },
            });
        });
    });

    describe('User event loggers', () => {
        it('logs logUserCreated with USER_CREATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logUserCreated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123', email: 'user@example.com' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.USER_CREATED,
                metadata: { userId: 'user-123', email: 'user@example.com' },
            });
        });

        it('logs logUserUpdated with USER_UPDATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logUserUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.USER_UPDATED,
                metadata: { userId: 'user-123' },
            });
        });

        it('logs logUserInvited with USER_INVITED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logUserInvited(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123', email: 'user@example.com' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.USER_INVITED,
                metadata: { userId: 'user-123', email: 'user@example.com' },
            });
        });

        it('logs logUserReactivated with USER_REACTIVATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logUserReactivated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.USER_REACTIVATED,
                metadata: { userId: 'user-123' },
            });
        });
    });

    describe('Profile event loggers', () => {
        it('logs logProfileUpdated with PROFILE_UPDATED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logProfileUpdated(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.PROFILE_UPDATED,
                metadata: { userId: 'user-123' },
            });
        });

        it('logs logProfilePasswordChanged with PROFILE_PASSWORD_CHANGED event type', async () => {
            vi.mocked(insertActivityLog).mockResolvedValueOnce(MOCK_ACTIVITY_LOG as never);

            await ActivityLogService.logProfilePasswordChanged(
                { ...MOCK_WRITE_CONTEXT, client: mockClient },
                { userId: 'user-123' },
            );

            expect(insertActivityLog).toHaveBeenCalledWith(mockClient, {
                organizationId: 'org-123',
                actorId: 'user-123',
                eventType: ACTIVITY_EVENTS.PROFILE_PASSWORD_CHANGED,
                metadata: { userId: 'user-123' },
            });
        });
    });
});
