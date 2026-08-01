import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb } from '#tests/mocks/database.mock.js';

// ---------------------------------------------------------------------------
// Module Mocks — hoisted by Vitest
// ---------------------------------------------------------------------------

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#databases/transaction.js', () => ({
    withTransaction: vi.fn((cb: (client: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock('#modules/user/repositories/user.repository.js', () => ({
    createUser: vi.fn(),
    findUserById: vi.fn(),
    findUserByEmail: vi.fn(),
    findUserByEmployeeId: vi.fn(),
    findUsersByOrganizationId: vi.fn(),
    updateUser: vi.fn(),
    activateUser: vi.fn(),
}));

vi.mock('#modules/employee/repositories/employee.repository.js', () => ({
    findEmployeeById: vi.fn(),
}));

vi.mock('#modules/role/repositories/role.repository.js', () => ({
    findRoleById: vi.fn(),
}));

vi.mock('#modules/profile/repositories/profile.repository.js', () => ({
    createProfile: vi.fn(),
}));

vi.mock('#shared/utils/password.util.js', () => ({
    hashPassword: vi.fn(),
}));

vi.mock('#modules/activity/services/activity.service.js', () => ({
    ActivityLogService: {
        logUserCreated: vi.fn().mockResolvedValue(undefined),
        logUserInvited: vi.fn().mockResolvedValue(undefined),
        logUserUpdated: vi.fn().mockResolvedValue(undefined),
        logUserReactivated: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logUserCreated: vi.fn().mockResolvedValue(undefined),
        logUserInvited: vi.fn().mockResolvedValue(undefined),
        logUserUpdated: vi.fn().mockResolvedValue(undefined),
        logUserReactivated: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import {
    createUser,
    inviteUser,
    getUsers,
    getUserById,
    updateUser,
    activateUser,
} from '#modules/user/services/user.service.js';
import {
    createUser as insertUser,
    findUserById,
    findUserByEmail,
    findUserByEmployeeId,
    findUsersByOrganizationId,
    updateUser as updateUserRepository,
    activateUser as activateUserRepository,
} from '#modules/user/repositories/user.repository.js';
import { findEmployeeById } from '#modules/employee/repositories/employee.repository.js';
import { findRoleById } from '#modules/role/repositories/role.repository.js';
import { createProfile } from '#modules/profile/repositories/profile.repository.js';
import { hashPassword } from '#shared/utils/password.util.js';
import { ActivityLogService } from '#modules/activity/services/activity.service.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { ConflictError } from '#shared/errors/conflict-error.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';
import { USER_STATUS } from '#modules/user/constants/user.constant.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_EMPLOYEE = {
    id: 'emp-123',
    organizationId: 'org-123',
    employeeNumber: 'EMP-0001',
    firstName: 'John',
    lastName: 'Doe',
};

const MOCK_ROLE = {
    id: 'role-123',
    organizationId: 'org-123',
    name: 'Admin',
};

const MOCK_USER_ROW = {
    id: 'user-123',
    employeeId: 'emp-123',
    organizationId: 'org-123',
    roleId: 'role-123',
    email: 'user@example.com',
    status: USER_STATUS.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const MOCK_CREATE_USER_INPUT = {
    employeeId: 'emp-123',
    roleId: 'role-123',
    email: 'user@example.com',
    password: 'Password123!',
};

const MOCK_INVITE_USER_INPUT = {
    employeeId: 'emp-123',
    roleId: 'role-123',
    email: 'invited@example.com',
};

const MOCK_UPDATE_USER_INPUT = {
    email: 'updated@example.com',
    roleId: 'role-new',
    password: 'NewPassword123!',
};

// ---------------------------------------------------------------------------
// Tests: createUser()
// ---------------------------------------------------------------------------

describe('createUser()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid user input is provided', () => {
        it('creates user, hashes password, creates profile, logs activity & audit events, and returns created user', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(MOCK_ROLE as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce(null);
            vi.mocked(hashPassword).mockResolvedValueOnce('$argon2id$hashed');
            vi.mocked(insertUser).mockResolvedValueOnce('user-123' as never);
            vi.mocked(createProfile).mockResolvedValueOnce(undefined as never);
            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);

            const result = await createUser('org-123', 'actor-123', MOCK_CREATE_USER_INPUT);

            expect(result).toEqual(MOCK_USER_ROW);
            expect(findEmployeeById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'emp-123');
            expect(findUserByEmployeeId).toHaveBeenCalledWith(expect.anything(), 'org-123', 'emp-123');
            expect(findRoleById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'role-123');
            expect(findUserByEmail).toHaveBeenCalledWith(expect.anything(), 'org-123', 'user@example.com');
            expect(hashPassword).toHaveBeenCalledWith('Password123!');
            expect(insertUser).toHaveBeenCalledWith(
                expect.anything(),
                'emp-123',
                'org-123',
                'role-123',
                MOCK_CREATE_USER_INPUT,
                '$argon2id$hashed',
                USER_STATUS.ACTIVE,
            );
            expect(createProfile).toHaveBeenCalledWith(expect.anything(), 'user-123');
            expect(findUserById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'user-123');

            expect(ActivityLogService.logUserCreated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123', email: 'user@example.com' },
            );
            expect(AuditLogService.logUserCreated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123', email: 'user@example.com' },
            );
        });
    });

    describe('when employee is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(null);

            await expect(
                createUser('org-123', 'actor-123', MOCK_CREATE_USER_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(insertUser).not.toHaveBeenCalled();
        });
    });

    describe('when employee already has a user account', () => {
        it('throws ConflictError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(MOCK_USER_ROW as never);

            await expect(
                createUser('org-123', 'actor-123', MOCK_CREATE_USER_INPUT),
            ).rejects.toThrow(ConflictError);

            expect(insertUser).not.toHaveBeenCalled();
        });
    });

    describe('when role is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(null);

            await expect(
                createUser('org-123', 'actor-123', MOCK_CREATE_USER_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(insertUser).not.toHaveBeenCalled();
        });
    });

    describe('when email is already taken in organization', () => {
        it('throws ConflictError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(MOCK_ROLE as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce(MOCK_USER_ROW as never);

            await expect(
                createUser('org-123', 'actor-123', MOCK_CREATE_USER_INPUT),
            ).rejects.toThrow(ConflictError);

            expect(insertUser).not.toHaveBeenCalled();
        });
    });

    describe('when created user is not found after insertion', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(MOCK_ROLE as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce(null);
            vi.mocked(hashPassword).mockResolvedValueOnce('$argon2id$hashed');
            vi.mocked(insertUser).mockResolvedValueOnce('user-123' as never);
            vi.mocked(createProfile).mockResolvedValueOnce(undefined as never);
            vi.mocked(findUserById).mockResolvedValueOnce(null);

            await expect(
                createUser('org-123', 'actor-123', MOCK_CREATE_USER_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(ActivityLogService.logUserCreated).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates transaction or repository error', async () => {
            vi.mocked(findEmployeeById).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                createUser('org-123', 'actor-123', MOCK_CREATE_USER_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: inviteUser()
// ---------------------------------------------------------------------------

describe('inviteUser()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid invite user input is provided', () => {
        it('creates user with INVITED status, creates profile, logs activity & audit events, and returns invited user', async () => {
            const invitedUserRow = {
                ...MOCK_USER_ROW,
                id: 'user-invited-123',
                email: 'invited@example.com',
                status: USER_STATUS.INVITED,
            };

            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(MOCK_ROLE as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce(null);
            vi.mocked(insertUser).mockResolvedValueOnce('user-invited-123' as never);
            vi.mocked(createProfile).mockResolvedValueOnce(undefined as never);
            vi.mocked(findUserById).mockResolvedValueOnce(invitedUserRow as never);

            const result = await inviteUser('org-123', 'actor-123', MOCK_INVITE_USER_INPUT);

            expect(result).toEqual(invitedUserRow);
            expect(insertUser).toHaveBeenCalledWith(
                expect.anything(),
                'emp-123',
                'org-123',
                'role-123',
                MOCK_INVITE_USER_INPUT,
                null,
                USER_STATUS.INVITED,
            );

            expect(ActivityLogService.logUserInvited).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-invited-123', email: 'invited@example.com' },
            );
            expect(AuditLogService.logUserInvited).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-invited-123', email: 'invited@example.com' },
            );
        });
    });

    describe('when employee is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(null);

            await expect(
                inviteUser('org-123', 'actor-123', MOCK_INVITE_USER_INPUT),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('when employee already has a user account', () => {
        it('throws ConflictError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(MOCK_USER_ROW as never);

            await expect(
                inviteUser('org-123', 'actor-123', MOCK_INVITE_USER_INPUT),
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('when role is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(null);

            await expect(
                inviteUser('org-123', 'actor-123', MOCK_INVITE_USER_INPUT),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('when email is already taken in organization', () => {
        it('throws ConflictError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(MOCK_ROLE as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce(MOCK_USER_ROW as never);

            await expect(
                inviteUser('org-123', 'actor-123', MOCK_INVITE_USER_INPUT),
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('when invited user is not found after insertion', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findEmployeeById).mockResolvedValueOnce(MOCK_EMPLOYEE as never);
            vi.mocked(findUserByEmployeeId).mockResolvedValueOnce(null);
            vi.mocked(findRoleById).mockResolvedValueOnce(MOCK_ROLE as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce(null);
            vi.mocked(insertUser).mockResolvedValueOnce('user-invited-123' as never);
            vi.mocked(createProfile).mockResolvedValueOnce(undefined as never);
            vi.mocked(findUserById).mockResolvedValueOnce(null);

            await expect(
                inviteUser('org-123', 'actor-123', MOCK_INVITE_USER_INPUT),
            ).rejects.toThrow(NotFoundError);
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getUsers()
// ---------------------------------------------------------------------------

describe('getUsers()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when organizationId is supplied', () => {
        it('returns all active users in the organization', async () => {
            const usersList = [MOCK_USER_ROW];

            vi.mocked(findUsersByOrganizationId).mockResolvedValueOnce(usersList as never);

            const result = await getUsers('org-123');

            expect(result).toEqual(usersList);
            expect(findUsersByOrganizationId).toHaveBeenCalledWith(expect.anything(), 'org-123');
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findUsersByOrganizationId).mockRejectedValueOnce(new Error('Database error'));

            await expect(getUsers('org-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: getUserById()
// ---------------------------------------------------------------------------

describe('getUserById()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid user id is supplied', () => {
        it('returns matching user details', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);

            const result = await getUserById('org-123', 'user-123');

            expect(result).toEqual(MOCK_USER_ROW);
            expect(findUserById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'user-123');
        });
    });

    describe('when user is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(null);

            await expect(getUserById('org-123', 'nonexistent')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findUserById).mockRejectedValueOnce(new Error('Database error'));

            await expect(getUserById('org-123', 'user-123')).rejects.toThrow('Database error');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: updateUser()
// ---------------------------------------------------------------------------

describe('updateUser()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid update input with password, new email, and new role is provided', () => {
        it('updates user, hashes password, logs activity & audit events, and returns updated user', async () => {
            const updatedUserRow = {
                ...MOCK_USER_ROW,
                email: 'updated@example.com',
                roleId: 'role-new',
            };

            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);
            vi.mocked(findRoleById).mockResolvedValueOnce({ id: 'role-new' } as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce(null);
            vi.mocked(hashPassword).mockResolvedValueOnce('$argon2id$newhashed');
            vi.mocked(updateUserRepository).mockResolvedValueOnce(updatedUserRow as never);

            const result = await updateUser(
                'org-123',
                'user-123',
                'actor-123',
                MOCK_UPDATE_USER_INPUT,
            );

            expect(result).toEqual(updatedUserRow);
            expect(findRoleById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'role-new');
            expect(findUserByEmail).toHaveBeenCalledWith(expect.anything(), 'org-123', 'updated@example.com');
            expect(hashPassword).toHaveBeenCalledWith('NewPassword123!');
            expect(updateUserRepository).toHaveBeenCalledWith(
                expect.anything(),
                'org-123',
                'user-123',
                MOCK_UPDATE_USER_INPUT,
                '$argon2id$newhashed',
            );

            expect(ActivityLogService.logUserUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
            expect(AuditLogService.logUserUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
        });
    });

    describe('when updating email to the same email', () => {
        it('skips duplicate email check and updates successfully', async () => {
            const sameEmailInput = { email: 'user@example.com' };

            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);
            vi.mocked(updateUserRepository).mockResolvedValueOnce(MOCK_USER_ROW as never);

            const result = await updateUser('org-123', 'user-123', 'actor-123', sameEmailInput);

            expect(result).toEqual(MOCK_USER_ROW);
            expect(findUserByEmail).not.toHaveBeenCalled();
        });
    });

    describe('when user is not found on initial lookup', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(null);

            await expect(
                updateUser('org-123', 'nonexistent', 'actor-123', MOCK_UPDATE_USER_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(updateUserRepository).not.toHaveBeenCalled();
        });
    });

    describe('when target role is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);
            vi.mocked(findRoleById).mockResolvedValueOnce(null);

            await expect(
                updateUser('org-123', 'user-123', 'actor-123', { roleId: 'nonexistent-role' }),
            ).rejects.toThrow(NotFoundError);

            expect(updateUserRepository).not.toHaveBeenCalled();
        });
    });

    describe('when new email collides with an existing user email', () => {
        it('throws ConflictError', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);
            vi.mocked(findUserByEmail).mockResolvedValueOnce({ id: 'user-other' } as never);

            await expect(
                updateUser('org-123', 'user-123', 'actor-123', { email: 'taken@example.com' }),
            ).rejects.toThrow(ConflictError);

            expect(updateUserRepository).not.toHaveBeenCalled();
        });
    });

    describe('when updateUserRepository returns null', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);
            vi.mocked(updateUserRepository).mockResolvedValueOnce(null);

            await expect(
                updateUser('org-123', 'user-123', 'actor-123', {}),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findUserById).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                updateUser('org-123', 'user-123', 'actor-123', MOCK_UPDATE_USER_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: activateUser()
// ---------------------------------------------------------------------------

describe('activateUser()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when inactive/invited user is activated', () => {
        it('activates user, logs activity & audit events, and returns activated user', async () => {
            const inactiveUserRow = { ...MOCK_USER_ROW, status: USER_STATUS.INACTIVE };
            const activatedUserRow = { ...MOCK_USER_ROW, status: USER_STATUS.ACTIVE };

            vi.mocked(findUserById).mockResolvedValueOnce(inactiveUserRow as never);
            vi.mocked(activateUserRepository).mockResolvedValueOnce(activatedUserRow as never);

            const result = await activateUser('org-123', 'user-123', 'actor-123');

            expect(result).toEqual(activatedUserRow);
            expect(activateUserRepository).toHaveBeenCalledWith(expect.anything(), 'org-123', 'user-123');

            expect(ActivityLogService.logUserReactivated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
            expect(AuditLogService.logUserReactivated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
        });
    });

    describe('when user is not found on initial lookup', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(null);

            await expect(activateUser('org-123', 'nonexistent', 'actor-123')).rejects.toThrow(NotFoundError);

            expect(activateUserRepository).not.toHaveBeenCalled();
        });
    });

    describe('when user account is already active', () => {
        it('throws ConflictError', async () => {
            vi.mocked(findUserById).mockResolvedValueOnce(MOCK_USER_ROW as never);

            await expect(activateUser('org-123', 'user-123', 'actor-123')).rejects.toThrow(ConflictError);

            expect(activateUserRepository).not.toHaveBeenCalled();
        });
    });

    describe('when activateUserRepository returns null', () => {
        it('throws NotFoundError', async () => {
            const inactiveUserRow = { ...MOCK_USER_ROW, status: USER_STATUS.INACTIVE };

            vi.mocked(findUserById).mockResolvedValueOnce(inactiveUserRow as never);
            vi.mocked(activateUserRepository).mockResolvedValueOnce(null);

            await expect(activateUser('org-123', 'user-123', 'actor-123')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findUserById).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(activateUser('org-123', 'user-123', 'actor-123')).rejects.toThrow('Database unavailable');
        });
    });
});
