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

vi.mock('#modules/employee/repositories/employee.repository.js', () => ({
    createEmployee: vi.fn(),
    findEmployeesByOrganizationId: vi.fn(),
    findEmployeeById: vi.fn(),
    updateEmployee: vi.fn(),
    softDeleteEmployee: vi.fn(),
}));

vi.mock('#modules/employee/services/employee-number.service.js', () => ({
    generateEmployeeNumber: vi.fn(),
}));

vi.mock('#modules/department/repositories/department.repository.js', () => ({
    findDepartmentById: vi.fn(),
}));

vi.mock('#modules/activity/services/activity.service.js', () => ({
    ActivityLogService: {
        logEmployeeCreated: vi.fn().mockResolvedValue(undefined),
        logEmployeeUpdated: vi.fn().mockResolvedValue(undefined),
        logEmployeeArchived: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logEmployeeCreated: vi.fn().mockResolvedValue(undefined),
        logEmployeeUpdated: vi.fn().mockResolvedValue(undefined),
        logEmployeeArchived: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
} from '#modules/employee/services/employee.service.js';
import {
    createEmployee as insertEmployee,
    findEmployeesByOrganizationId,
    findEmployeeById,
    updateEmployee as updateEmployeeRepository,
    softDeleteEmployee,
} from '#modules/employee/repositories/employee.repository.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { findDepartmentById } from '#modules/department/repositories/department.repository.js';
import { ActivityLogService } from '#modules/activity/services/activity.service.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';

// Unmocked original function for generateEmployeeNumber unit testing
const actualGenerateEmployeeNumber = (
    await vi.importActual<typeof import('#modules/employee/services/employee-number.service.js')>(
        '#modules/employee/services/employee-number.service.js',
    )
).generateEmployeeNumber;

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_DEPARTMENT = {
    id: 'dept-123',
    organizationId: 'org-123',
    name: 'Engineering',
};

const MOCK_EMPLOYEE_ROW = {
    id: 'emp-123',
    organizationId: 'org-123',
    employeeNumber: 'EMP-000001',
    firstName: 'Jane',
    middleName: 'A.',
    lastName: 'Doe',
    nameExtension: null,
    jobTitle: 'Software Engineer',
    employmentStatus: 'regular',
    departmentId: 'dept-123',
    hireDate: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
};

const MOCK_CREATE_EMPLOYEE_INPUT = {
    firstName: 'Jane',
    middleName: 'A.',
    lastName: 'Doe',
    jobTitle: 'Software Engineer',
    employmentStatus: 'regular' as const,
    departmentId: 'dept-123',
    hireDate: new Date('2026-01-01T00:00:00.000Z'),
};

const MOCK_UPDATE_EMPLOYEE_INPUT = {
    firstName: 'Janet',
    jobTitle: 'Senior Software Engineer',
    departmentId: 'dept-123',
};

// ---------------------------------------------------------------------------
// Tests: createEmployee()
// ---------------------------------------------------------------------------

describe('createEmployee()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid employee input with departmentId is provided', () => {
        it('verifies department, generates employee number, inserts employee, logs activity & audit events, and returns created employee', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPARTMENT as never);
            vi.mocked(generateEmployeeNumber).mockResolvedValueOnce('EMP-000001');
            vi.mocked(insertEmployee).mockResolvedValueOnce(MOCK_EMPLOYEE_ROW as never);

            const result = await createEmployee('org-123', 'actor-123', MOCK_CREATE_EMPLOYEE_INPUT);

            expect(result).toEqual(MOCK_EMPLOYEE_ROW);
            expect(findDepartmentById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'dept-123');
            expect(generateEmployeeNumber).toHaveBeenCalledWith(expect.anything(), 'org-123');
            expect(insertEmployee).toHaveBeenCalledWith(
                expect.anything(),
                'org-123',
                'EMP-000001',
                MOCK_CREATE_EMPLOYEE_INPUT,
            );

            expect(ActivityLogService.logEmployeeCreated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                {
                    employeeId: 'emp-123',
                    employeeNumber: 'EMP-000001',
                    firstName: 'Jane',
                    lastName: 'Doe',
                },
            );
            expect(AuditLogService.logEmployeeCreated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                {
                    employeeId: 'emp-123',
                    employeeNumber: 'EMP-000001',
                    firstName: 'Jane',
                    lastName: 'Doe',
                },
            );
        });
    });

    describe('when valid employee input without departmentId is provided', () => {
        it('skips department lookup, generates employee number, inserts employee, and returns employee', async () => {
            const inputNoDept = {
                firstName: 'Jane',
                lastName: 'Doe',
                jobTitle: 'Software Engineer',
                employmentStatus: 'regular' as const,
                hireDate: new Date('2026-01-01T00:00:00.000Z'),
            };

            const employeeNoDept = { ...MOCK_EMPLOYEE_ROW, departmentId: null };

            vi.mocked(generateEmployeeNumber).mockResolvedValueOnce('EMP-000001');
            vi.mocked(insertEmployee).mockResolvedValueOnce(employeeNoDept as never);

            const result = await createEmployee('org-123', 'actor-123', inputNoDept);

            expect(result).toEqual(employeeNoDept);
            expect(findDepartmentById).not.toHaveBeenCalled();
            expect(insertEmployee).toHaveBeenCalledWith(
                expect.anything(),
                'org-123',
                'EMP-000001',
                inputNoDept,
            );
        });
    });

    describe('when department is specified but not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findDepartmentById).mockResolvedValueOnce(null);

            await expect(
                createEmployee('org-123', 'actor-123', MOCK_CREATE_EMPLOYEE_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(generateEmployeeNumber).not.toHaveBeenCalled();
            expect(insertEmployee).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates transaction or repository failure', async () => {
            vi.mocked(findDepartmentById).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                createEmployee('org-123', 'actor-123', MOCK_CREATE_EMPLOYEE_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getEmployees()
// ---------------------------------------------------------------------------

describe('getEmployees()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when organizationId is supplied', () => {
        it('returns all active employees for the organization', async () => {
            const employeesList = [MOCK_EMPLOYEE_ROW];

            vi.mocked(findEmployeesByOrganizationId).mockResolvedValueOnce(employeesList as never);

            const result = await getEmployees('org-123');

            expect(result).toEqual(employeesList);
            expect(findEmployeesByOrganizationId).toHaveBeenCalledWith(expect.anything(), 'org-123');
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findEmployeesByOrganizationId).mockRejectedValueOnce(new Error('Database error'));

            await expect(getEmployees('org-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getEmployeeById()
// ---------------------------------------------------------------------------

describe('getEmployeeById()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid employee id is supplied', () => {
        it('returns matching employee details', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE_ROW as never);

            const result = await getEmployeeById('org-123', 'emp-123');

            expect(result).toEqual(MOCK_EMPLOYEE_ROW);
            expect(findEmployeeById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'emp-123');
        });
    });

    describe('when employee is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(null);

            await expect(getEmployeeById('org-123', 'nonexistent')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findEmployeeById).mockRejectedValueOnce(new Error('Database error'));

            await expect(getEmployeeById('org-123', 'emp-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: updateEmployee()
// ---------------------------------------------------------------------------

describe('updateEmployee()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid update input with departmentId is provided', () => {
        it('verifies existing employee and department, updates repository, logs activity & audit events, and returns updated employee', async () => {
            const updatedEmployee = { ...MOCK_EMPLOYEE_ROW, firstName: 'Janet', jobTitle: 'Senior Software Engineer' };

            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE_ROW as never);
            vi.mocked(findDepartmentById).mockResolvedValueOnce(MOCK_DEPARTMENT as never);
            vi.mocked(updateEmployeeRepository).mockResolvedValueOnce(updatedEmployee as never);

            const result = await updateEmployee(
                'org-123',
                'emp-123',
                'actor-123',
                MOCK_UPDATE_EMPLOYEE_INPUT,
            );

            expect(result).toEqual(updatedEmployee);
            expect(findEmployeeById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'emp-123');
            expect(findDepartmentById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'dept-123');
            expect(updateEmployeeRepository).toHaveBeenCalledWith(
                expect.anything(),
                'org-123',
                'emp-123',
                MOCK_UPDATE_EMPLOYEE_INPUT,
            );

            expect(ActivityLogService.logEmployeeUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { employeeId: 'emp-123' },
            );
            expect(AuditLogService.logEmployeeUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { employeeId: 'emp-123' },
            );
        });
    });

    describe('when employee is not found on initial lookup', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(null);

            await expect(
                updateEmployee('org-123', 'nonexistent', 'actor-123', MOCK_UPDATE_EMPLOYEE_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(updateEmployeeRepository).not.toHaveBeenCalled();
        });
    });

    describe('when target department is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE_ROW as never);
            vi.mocked(findDepartmentById).mockResolvedValueOnce(null);

            await expect(
                updateEmployee('org-123', 'emp-123', 'actor-123', { departmentId: 'nonexistent-dept' }),
            ).rejects.toThrow(NotFoundError);

            expect(updateEmployeeRepository).not.toHaveBeenCalled();
        });
    });

    describe('when updateEmployeeRepository returns null', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE_ROW as never);
            vi.mocked(updateEmployeeRepository).mockResolvedValueOnce(null);

            await expect(
                updateEmployee('org-123', 'emp-123', 'actor-123', {}),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findEmployeeById).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                updateEmployee('org-123', 'emp-123', 'actor-123', MOCK_UPDATE_EMPLOYEE_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: deleteEmployee()
// ---------------------------------------------------------------------------

describe('deleteEmployee()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid employee id is supplied', () => {
        it('soft deletes employee and logs activity & audit archive events', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE_ROW as never);
            vi.mocked(softDeleteEmployee).mockResolvedValueOnce(true as never);

            await deleteEmployee('org-123', 'emp-123', 'actor-123');

            expect(findEmployeeById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'emp-123');
            expect(softDeleteEmployee).toHaveBeenCalledWith(expect.anything(), 'org-123', 'emp-123');

            expect(ActivityLogService.logEmployeeArchived).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { employeeId: 'emp-123' },
            );
            expect(AuditLogService.logEmployeeArchived).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { employeeId: 'emp-123' },
            );
        });
    });

    describe('when employee is not found on initial lookup', () => {
        it('throws NotFoundError and skips soft delete', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(null);

            await expect(deleteEmployee('org-123', 'nonexistent', 'actor-123')).rejects.toThrow(NotFoundError);

            expect(softDeleteEmployee).not.toHaveBeenCalled();
        });
    });

    describe('when softDeleteEmployee returns false', () => {
        it('throws NotFoundError and skips logging', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE_ROW as never);
            vi.mocked(softDeleteEmployee).mockResolvedValueOnce(false as never);

            await expect(deleteEmployee('org-123', 'emp-123', 'actor-123')).rejects.toThrow(NotFoundError);

            expect(ActivityLogService.logEmployeeArchived).not.toHaveBeenCalled();
            expect(AuditLogService.logEmployeeArchived).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failure', async () => {
            vi.mocked(findEmployeeById).mockRejectedValueOnce(new Error('Database error'));

            await expect(deleteEmployee('org-123', 'emp-123', 'actor-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: generateEmployeeNumber()
// ---------------------------------------------------------------------------

describe('generateEmployeeNumber()', () => {
    it('queries employee count for organization and formats next employee number EMP-00000X', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValueOnce({
                rows: [{ count: '5' }],
                rowCount: 1,
            }),
        } as unknown as PoolClient;

        const result = await actualGenerateEmployeeNumber(mockClient, 'org-123');

        expect(result).toBe('EMP-000006');
        expect(mockClient.query).toHaveBeenCalledWith(
            expect.stringContaining('SELECT COUNT(*) AS count'),
            ['org-123'],
        );
    });

    it('throws Error when query result rows are empty', async () => {
        const mockClient = {
            query: vi.fn().mockResolvedValueOnce({
                rows: [],
                rowCount: 0,
            }),
        } as unknown as PoolClient;

        await expect(actualGenerateEmployeeNumber(mockClient, 'org-123')).rejects.toThrow(
            'Failed to generate employee number for organization org-123.',
        );
    });
});
