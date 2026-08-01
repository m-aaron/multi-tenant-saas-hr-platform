import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb } from '#tests/mocks/database.mock.js';

// ---------------------------------------------------------------------------
// Module Mocks — hoisted by Vitest
// ---------------------------------------------------------------------------

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#databases/transaction.js', () => ({
    withTransaction: vi.fn((cb: (client: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock('#modules/organization/repositories/organization.repository.js', () => ({
    findOrganizationByName: vi.fn(),
    findOrganizationBySlug: vi.fn(),
    createOrganization: vi.fn(),
}));

vi.mock('#modules/role/repositories/role.repository.js', () => ({
    seedDefaultRoles: vi.fn(),
    findRoleByName: vi.fn(),
}));

vi.mock('#modules/employee/services/employee-number.service.js', () => ({
    generateEmployeeNumber: vi.fn(),
}));

vi.mock('#modules/employee/repositories/employee.repository.js', () => ({
    createEmployee: vi.fn(),
}));

vi.mock('#shared/utils/password.util.js', () => ({
    hashPassword: vi.fn(),
}));

vi.mock('#modules/user/repositories/user.repository.js', () => ({
    createUser: vi.fn(),
}));

vi.mock('#modules/profile/repositories/profile.repository.js', () => ({
    createProfile: vi.fn(),
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logOrganizationRegistered: vi.fn().mockResolvedValue(undefined),
        logEmployeeCreated: vi.fn().mockResolvedValue(undefined),
        logUserCreated: vi.fn().mockResolvedValue(undefined),
        logProfileCreated: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import { registerOrganization } from '#modules/auth/services/auth.service.js';
import {
    findOrganizationByName,
    findOrganizationBySlug,
    createOrganization,
} from '#modules/organization/repositories/organization.repository.js';
import {
    seedDefaultRoles,
    findRoleByName,
} from '#modules/role/repositories/role.repository.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { createEmployee } from '#modules/employee/repositories/employee.repository.js';
import { hashPassword } from '#shared/utils/password.util.js';
import { createUser } from '#modules/user/repositories/user.repository.js';
import { createProfile } from '#modules/profile/repositories/profile.repository.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { ConflictError } from '#shared/errors/conflict-error.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';
import { OWNER_EMPLOYEE_DEFAULTS } from '#modules/employee/constants/employee.constant.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

import { MOCK_REGISTER_INPUT, MOCK_ORG } from '#tests/helpers/test-auth-fixture.js';

// ---------------------------------------------------------------------------
// Tests: registerOrganization()
// ---------------------------------------------------------------------------

describe('registerOrganization()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid organization registration details are supplied', () => {
        it('creates organization, seeds roles, creates employee, user, profile, and logs audit events', async () => {
            vi.mocked(findOrganizationByName).mockResolvedValueOnce(null);
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(null);
            vi.mocked(createOrganization).mockResolvedValueOnce(MOCK_ORG as never);
            vi.mocked(seedDefaultRoles).mockResolvedValueOnce(undefined as never);
            vi.mocked(findRoleByName).mockResolvedValueOnce('role-owner-123' as never);
            vi.mocked(generateEmployeeNumber).mockResolvedValueOnce('EMP-0001');
            vi.mocked(createEmployee).mockResolvedValueOnce({
                id: 'emp-123',
                organizationId: 'org-123',
                employeeNumber: 'EMP-0001',
            } as never);
            vi.mocked(hashPassword).mockResolvedValueOnce('$argon2id$hashed');
            vi.mocked(createUser).mockResolvedValueOnce('user-123' as never);
            vi.mocked(createProfile).mockResolvedValueOnce(undefined as never);

            await registerOrganization(MOCK_REGISTER_INPUT);

            expect(findOrganizationByName).toHaveBeenCalledWith(expect.anything(), MOCK_REGISTER_INPUT.name);
            expect(findOrganizationBySlug).toHaveBeenCalledWith(expect.anything(), MOCK_REGISTER_INPUT.slug);
            expect(createOrganization).toHaveBeenCalledWith(expect.anything(), {
                name: MOCK_REGISTER_INPUT.name,
                slug: MOCK_REGISTER_INPUT.slug,
            });
            expect(seedDefaultRoles).toHaveBeenCalledWith(expect.anything(), MOCK_ORG.id);
            expect(findRoleByName).toHaveBeenCalledWith(expect.anything(), MOCK_ORG.id, OWNER_EMPLOYEE_DEFAULTS.jobTitle);
            expect(generateEmployeeNumber).toHaveBeenCalledWith(expect.anything(), MOCK_ORG.id);
            expect(createEmployee).toHaveBeenCalledWith(expect.anything(), MOCK_ORG.id, 'EMP-0001', expect.objectContaining({
                firstName: MOCK_REGISTER_INPUT.firstName,
                lastName: MOCK_REGISTER_INPUT.lastName,
                jobTitle: OWNER_EMPLOYEE_DEFAULTS.jobTitle,
                employmentStatus: OWNER_EMPLOYEE_DEFAULTS.employmentStatus,
            }));
            expect(hashPassword).toHaveBeenCalledWith(MOCK_REGISTER_INPUT.password);
            expect(createUser).toHaveBeenCalledWith(
                expect.anything(),
                'emp-123',
                MOCK_ORG.id,
                'role-owner-123',
                { email: MOCK_REGISTER_INPUT.ownerEmail },
                '$argon2id$hashed',
            );
            expect(createProfile).toHaveBeenCalledWith(expect.anything(), 'user-123');

            expect(AuditLogService.logOrganizationRegistered).toHaveBeenCalledWith(
                { organizationId: MOCK_ORG.id, actorId: null, client: expect.anything() },
                { organizationId: MOCK_ORG.id, name: MOCK_REGISTER_INPUT.name, slug: MOCK_REGISTER_INPUT.slug },
            );
            expect(AuditLogService.logEmployeeCreated).toHaveBeenCalledWith(
                { organizationId: MOCK_ORG.id, actorId: null, client: expect.anything() },
                { employeeId: 'emp-123', employeeNumber: 'EMP-0001', firstName: MOCK_REGISTER_INPUT.firstName, lastName: MOCK_REGISTER_INPUT.lastName },
            );
            expect(AuditLogService.logUserCreated).toHaveBeenCalledWith(
                { organizationId: MOCK_ORG.id, actorId: null, client: expect.anything() },
                { userId: 'user-123', email: MOCK_REGISTER_INPUT.ownerEmail },
            );
            expect(AuditLogService.logProfileCreated).toHaveBeenCalledWith(
                { organizationId: MOCK_ORG.id, actorId: null, client: expect.anything() },
                { userId: 'user-123' },
            );
        });
    });

    describe('when organization name already exists', () => {
        it('throws ConflictError and aborts creation', async () => {
            vi.mocked(findOrganizationByName).mockResolvedValueOnce(MOCK_ORG as never);

            await expect(registerOrganization(MOCK_REGISTER_INPUT)).rejects.toThrow(ConflictError);
            expect(findOrganizationBySlug).not.toHaveBeenCalled();
            expect(createOrganization).not.toHaveBeenCalled();
        });
    });

    describe('when organization slug already exists', () => {
        it('throws ConflictError when slug is taken', async () => {
            vi.mocked(findOrganizationByName).mockResolvedValueOnce(null);
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(MOCK_ORG as never);

            await expect(registerOrganization(MOCK_REGISTER_INPUT)).rejects.toThrow(ConflictError);
            expect(createOrganization).not.toHaveBeenCalled();
        });
    });

    describe('when owner role is not found after seeding', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findOrganizationByName).mockResolvedValueOnce(null);
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(null);
            vi.mocked(createOrganization).mockResolvedValueOnce(MOCK_ORG as never);
            vi.mocked(seedDefaultRoles).mockResolvedValueOnce(undefined as never);
            vi.mocked(findRoleByName).mockResolvedValueOnce(null);

            await expect(registerOrganization(MOCK_REGISTER_INPUT)).rejects.toThrow(NotFoundError);
            expect(generateEmployeeNumber).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates transaction or database failures', async () => {
            vi.mocked(findOrganizationByName).mockRejectedValueOnce(new Error('Database error'));

            await expect(registerOrganization(MOCK_REGISTER_INPUT)).rejects.toThrow('Database error');
        });
    });
});
