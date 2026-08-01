import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb } from '#tests/mocks/database.mock.js';

// ---------------------------------------------------------------------------
// Module Mocks — hoisted by Vitest
// ---------------------------------------------------------------------------

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#databases/transaction.js', () => ({
    withTransaction: vi.fn((cb: (client: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock('#modules/department/repositories/department.repository.js', () => ({
    findDepartmentByName: vi.fn(),
    insertDepartment: vi.fn(),
    findDepartmentById: vi.fn(),
    updateDepartmentName: vi.fn(),
    findDepartmentsByOrganizationId: vi.fn(),
    clearEmployeesDepartment: vi.fn(),
    softDeleteDepartment: vi.fn(),
}));

vi.mock('#modules/activity/services/activity.service.js', () => ({
    ActivityLogService: {
        logDepartmentCreated: vi.fn().mockResolvedValue(undefined),
        logDepartmentUpdated: vi.fn().mockResolvedValue(undefined),
        logDepartmentArchived: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logDepartmentCreated: vi.fn().mockResolvedValue(undefined),
        logDepartmentUpdated: vi.fn().mockResolvedValue(undefined),
        logDepartmentArchived: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import {
    createDepartment,
    updateDepartment,
    getDepartments,
    getDepartmentById,
    deleteDepartment,
} from '#modules/department/services/department.service.js';
import {
    findDepartmentByName,
    insertDepartment,
    findDepartmentById,
    updateDepartmentName,
    findDepartmentsByOrganizationId,
    clearEmployeesDepartment,
    softDeleteDepartment,
} from '#modules/department/repositories/department.repository.js';
import { ActivityLogService } from '#modules/activity/services/activity.service.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { ConflictError } from '#shared/errors/conflict-error.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_DEPT = {
    id: 'dept-123',
    organizationId: 'org-123',
    name: 'Engineering',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
};

const MOCK_CREATE_INPUT = {
    name: 'Engineering',
};

const MOCK_UPDATE_INPUT = {
    name: 'Software Engineering',
};

// ---------------------------------------------------------------------------
// Tests: createDepartment()
// ---------------------------------------------------------------------------

describe('createDepartment()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid department input is provided', () => {
        it('inserts department, logs activity & audit events, and returns created department', async () => {
            vi.mocked(findDepartmentByName).mockResolvedValueOnce(null);
            vi.mocked(insertDepartment).mockResolvedValueOnce(MOCK_DEPT as never);

            const result = await createDepartment('org-123', 'actor-123', MOCK_CREATE_INPUT);

            expect(result).toEqual(MOCK_DEPT);
            expect(findDepartmentByName).toHaveBeenCalledWith(expect.anything(), 'org-123', MOCK_CREATE_INPUT);
            expect(insertDepartment).toHaveBeenCalledWith(expect.anything(), 'org-123', MOCK_CREATE_INPUT);

            expect(ActivityLogService.logDepartmentCreated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { departmentId: 'dept-123', name: 'Engineering' },
            );
            expect(AuditLogService.logDepartmentCreated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { departmentId: 'dept-123', name: 'Engineering' },
            );
        });
    });

    describe('when department name already exists in organization', () => {
        it('throws ConflictError and skips department insertion and audit logs', async () => {
            vi.mocked(findDepartmentByName).mockResolvedValueOnce(MOCK_DEPT as never);

            await expect(
                createDepartment('org-123', 'actor-123', MOCK_CREATE_INPUT),
            ).rejects.toThrow(ConflictError);

            expect(insertDepartment).not.toHaveBeenCalled();
            expect(ActivityLogService.logDepartmentCreated).not.toHaveBeenCalled();
            expect(AuditLogService.logDepartmentCreated).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates transaction or repository failure', async () => {
            vi.mocked(findDepartmentByName).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                createDepartment('org-123', 'actor-123', MOCK_CREATE_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: updateDepartment()
// ---------------------------------------------------------------------------

describe('updateDepartment()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid new name is provided', () => {
        it('updates department, logs activity & audit events, and returns updated department', async () => {
            const updatedDept = { ...MOCK_DEPT, name: 'Software Engineering' };

            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPT as never);
            vi.mocked(findDepartmentByName).mockResolvedValueOnce(null);
            vi.mocked(updateDepartmentName).mockResolvedValueOnce(updatedDept as never);

            const result = await updateDepartment('org-123', 'dept-123', 'actor-123', MOCK_UPDATE_INPUT);

            expect(result).toEqual(updatedDept);
            expect(findDepartmentById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'dept-123');
            expect(findDepartmentByName).toHaveBeenCalledWith(expect.anything(), 'org-123', MOCK_UPDATE_INPUT);
            expect(updateDepartmentName).toHaveBeenCalledWith(expect.anything(), 'dept-123', MOCK_UPDATE_INPUT);

            expect(ActivityLogService.logDepartmentUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { departmentId: 'dept-123', name: 'Software Engineering' },
            );
            expect(AuditLogService.logDepartmentUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { departmentId: 'dept-123', name: 'Software Engineering' },
            );
        });
    });

    describe('when updating name to the same value (case-insensitive)', () => {
        it('skips duplicate check and updates successfully', async () => {
            const sameNameInput = { name: 'ENGINEERING' };
            const updatedDept = { ...MOCK_DEPT, name: 'ENGINEERING' };

            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPT as never);
            vi.mocked(updateDepartmentName).mockResolvedValueOnce(updatedDept as never);

            const result = await updateDepartment('org-123', 'dept-123', 'actor-123', sameNameInput);

            expect(result).toEqual(updatedDept);
            expect(findDepartmentByName).not.toHaveBeenCalled();
            expect(updateDepartmentName).toHaveBeenCalledWith(expect.anything(), 'dept-123', sameNameInput);
        });
    });

    describe('when target department is not found on initial lookup', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(null);

            await expect(
                updateDepartment('org-123', 'nonexistent', 'actor-123', MOCK_UPDATE_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(updateDepartmentName).not.toHaveBeenCalled();
        });
    });

    describe('when updated name collides with another department in the same organization', () => {
        it('throws ConflictError', async () => {
            const existingOtherDept = { ...MOCK_DEPT, id: 'dept-other' };

            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPT as never);
            vi.mocked(findDepartmentByName).mockResolvedValueOnce(existingOtherDept as never);

            await expect(
                updateDepartment('org-123', 'dept-123', 'actor-123', MOCK_UPDATE_INPUT),
            ).rejects.toThrow(ConflictError);

            expect(updateDepartmentName).not.toHaveBeenCalled();
        });
    });

    describe('when updateDepartmentName returns null', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPT as never);
            vi.mocked(findDepartmentByName).mockResolvedValueOnce(null);
            vi.mocked(updateDepartmentName).mockResolvedValueOnce(null);

            await expect(
                updateDepartment('org-123', 'dept-123', 'actor-123', MOCK_UPDATE_INPUT),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failure', async () => {
            vi.mocked(findDepartmentById).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                updateDepartment('org-123', 'dept-123', 'actor-123', MOCK_UPDATE_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getDepartments()
// ---------------------------------------------------------------------------

describe('getDepartments()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when organizationId is supplied', () => {
        it('returns all active departments for the organization', async () => {
            const departmentsList = [MOCK_DEPT];

            vi.mocked(findDepartmentsByOrganizationId).mockResolvedValueOnce(departmentsList as never);

            const result = await getDepartments('org-123');

            expect(result).toEqual(departmentsList);
            expect(findDepartmentsByOrganizationId).toHaveBeenCalledWith(expect.anything(), 'org-123');
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failure', async () => {
            vi.mocked(findDepartmentsByOrganizationId).mockRejectedValueOnce(new Error('Database error'));

            await expect(getDepartments('org-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getDepartmentById()
// ---------------------------------------------------------------------------

describe('getDepartmentById()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid organizationId and department id are supplied', () => {
        it('returns matching department', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPT as never);

            const result = await getDepartmentById('org-123', 'dept-123');

            expect(result).toEqual(MOCK_DEPT);
            expect(findDepartmentById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'dept-123');
        });
    });

    describe('when department is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(null);

            await expect(getDepartmentById('org-123', 'nonexistent')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failure', async () => {
            vi.mocked(findDepartmentById).mockRejectedValueOnce(new Error('Database error'));

            await expect(getDepartmentById('org-123', 'dept-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: deleteDepartment()
// ---------------------------------------------------------------------------

describe('deleteDepartment()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid department id is supplied', () => {
        it('unlinks employees, soft deletes department, and logs activity & audit events', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPT as never);
            vi.mocked(clearEmployeesDepartment).mockResolvedValueOnce(undefined as never);
            vi.mocked(softDeleteDepartment).mockResolvedValueOnce(true as never);

            await deleteDepartment('org-123', 'dept-123', 'actor-123');

            expect(findDepartmentById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'dept-123');
            expect(clearEmployeesDepartment).toHaveBeenCalledWith(expect.anything(), 'org-123', 'dept-123');
            expect(softDeleteDepartment).toHaveBeenCalledWith(expect.anything(), 'org-123', 'dept-123');

            expect(ActivityLogService.logDepartmentArchived).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { departmentId: 'dept-123', name: 'Engineering' },
            );
            expect(AuditLogService.logDepartmentArchived).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { departmentId: 'dept-123', name: 'Engineering' },
            );
        });
    });

    describe('when department is not found on initial lookup', () => {
        it('throws NotFoundError and skips unlinking and deleting', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(null);

            await expect(deleteDepartment('org-123', 'nonexistent', 'actor-123')).rejects.toThrow(NotFoundError);

            expect(clearEmployeesDepartment).not.toHaveBeenCalled();
            expect(softDeleteDepartment).not.toHaveBeenCalled();
        });
    });

    describe('when softDeleteDepartment returns false', () => {
        it('throws NotFoundError and skips logging', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPT as never);
            vi.mocked(clearEmployeesDepartment).mockResolvedValueOnce(undefined as never);
            vi.mocked(softDeleteDepartment).mockResolvedValueOnce(false as never);

            await expect(deleteDepartment('org-123', 'dept-123', 'actor-123')).rejects.toThrow(NotFoundError);

            expect(ActivityLogService.logDepartmentArchived).not.toHaveBeenCalled();
            expect(AuditLogService.logDepartmentArchived).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failure', async () => {
            vi.mocked(findDepartmentById).mockRejectedValueOnce(new Error('Database error'));

            await expect(deleteDepartment('org-123', 'dept-123', 'actor-123')).rejects.toThrow('Database error');
        });
    });
});
