import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb } from '#tests/mocks/database.mock.js';

// ---------------------------------------------------------------------------
// Module Mocks — hoisted by Vitest
// ---------------------------------------------------------------------------

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#databases/transaction.js', () => ({
    withTransaction: vi.fn((cb: (client: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock('#modules/profile/repositories/profile.repository.js', () => ({
    findProfileByUserId: vi.fn(),
    updateProfile: vi.fn(),
}));

vi.mock('#modules/user/repositories/user.repository.js', () => ({
    findUserWithPasswordHashById: vi.fn(),
    updateUser: vi.fn(),
}));

vi.mock('#shared/utils/password.util.js', () => ({
    verifyPassword: vi.fn(),
    hashPassword: vi.fn(),
}));

vi.mock('#modules/activity/services/activity.service.js', () => ({
    ActivityLogService: {
        logProfileUpdated: vi.fn().mockResolvedValue(undefined),
        logProfilePasswordChanged: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logProfileUpdated: vi.fn().mockResolvedValue(undefined),
        logProfilePasswordChanged: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import {
    getProfile,
    updateProfile,
    updatePassword,
} from '#modules/profile/services/profile.service.js';
import {
    findProfileByUserId,
    updateProfile as updateProfileRepository,
} from '#modules/profile/repositories/profile.repository.js';
import {
    findUserWithPasswordHashById,
    updateUser as updateUserRepository,
} from '#modules/user/repositories/user.repository.js';
import { verifyPassword, hashPassword } from '#shared/utils/password.util.js';
import { ActivityLogService } from '#modules/activity/services/activity.service.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';
import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_PROFILE_DETAILS = {
    profile: {
        profileId: 'profile-123',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    organization: {
        organizationId: 'org-123',
        organizationName: 'Acme Corp',
        organizationSlug: 'acme-corp',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    role: {
        roleId: 'role-123',
        roleName: 'Admin'
    },
    user: {
        userId: 'user-123',
        email: 'user@example.com',
        status: 'active',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    department: {
        departmentId: 'dept-123',
        name: 'Engineering',
    },
    employee: {
        employeeId: 'emp-123',
        employeeNumber: 'EMP-000001',
        firstName: 'Jane',
        middleName: 'A.',
        lastName: 'Doe',
        nameExtension: null,
        jobTitle: 'Software Engineer',
        employmentStatus: 'regular',
        hireDate: new Date('2026-01-01T00:00:00.000Z'),
    }
}

const MOCK_PROFILE_ROW = {
    id: 'profile-123',
    userId: 'user-123',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const MOCK_UPDATE_PROFILE_INPUT = {
    avatarUrl: 'https://example.com/avatar.jpg'
};

const MOCK_UPDATE_PASSWORD_INPUT = {
    currentPassword: 'CurrentPassword123!',
    newPassword: 'NewPassword123!',
};

// ---------------------------------------------------------------------------
// Tests: getProfile()
// ---------------------------------------------------------------------------

describe('getProfile()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid userId is supplied', () => {
        it('returns full profile details', async () => {
            vi.mocked(findProfileByUserId).mockResolvedValueOnce(MOCK_PROFILE_DETAILS as never);

            const result = await getProfile('user-123');

            expect(result).toEqual(MOCK_PROFILE_DETAILS);
            expect(findProfileByUserId).toHaveBeenCalledWith(expect.anything(), 'user-123');
        });
    });

    describe('when profile is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findProfileByUserId).mockResolvedValueOnce(null);

            await expect(getProfile('nonexistent-user')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findProfileByUserId).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(getProfile('user-123')).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: updateProfile()
// ---------------------------------------------------------------------------

describe('updateProfile()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid update input is provided', () => {
        it('verifies profile exists, updates repository, logs activity & audit events, and returns updated profile', async () => {
            const updatedProfileRow = {
                ...MOCK_PROFILE_ROW,
                avatarUrl: 'https://example.com/new-avatar.jpg'
            };

            vi.mocked(findProfileByUserId).mockResolvedValueOnce(MOCK_PROFILE_DETAILS as never);
            vi.mocked(updateProfileRepository).mockResolvedValueOnce(updatedProfileRow as never);

            const result = await updateProfile('user-123', 'actor-123', MOCK_UPDATE_PROFILE_INPUT);

            expect(result).toEqual(updatedProfileRow);
            expect(findProfileByUserId).toHaveBeenCalledWith(expect.anything(), 'user-123');
            expect(updateProfileRepository).toHaveBeenCalledWith(
                expect.anything(),
                'user-123',
                MOCK_UPDATE_PROFILE_INPUT,
            );

            expect(ActivityLogService.logProfileUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
            expect(AuditLogService.logProfileUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
        });
    });

    describe('when profile is not found on initial lookup', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findProfileByUserId).mockResolvedValueOnce(null);

            await expect(
                updateProfile('nonexistent-user', 'actor-123', MOCK_UPDATE_PROFILE_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(updateProfileRepository).not.toHaveBeenCalled();
        });
    });

    describe('when updateProfileRepository returns null', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findProfileByUserId).mockResolvedValueOnce(MOCK_PROFILE_DETAILS as never);
            vi.mocked(updateProfileRepository).mockResolvedValueOnce(null);

            await expect(
                updateProfile('user-123', 'actor-123', MOCK_UPDATE_PROFILE_INPUT),
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findProfileByUserId).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                updateProfile('user-123', 'actor-123', MOCK_UPDATE_PROFILE_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: updatePassword()
// ---------------------------------------------------------------------------

describe('updatePassword()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid current and new password are provided', () => {
        it('verifies current password, hashes new password, updates user, and logs activity & audit events', async () => {
            const mockUserWithPassword = {
                id: 'user-123',
                email: 'user@example.com',
                passwordHash: '$argon2id$currentpasswordhash',
            };

            const updatedUserRow = {
                id: 'user-123',
                email: 'user@example.com',
            };

            vi.mocked(findProfileByUserId).mockResolvedValueOnce(MOCK_PROFILE_DETAILS as never);
            vi.mocked(findUserWithPasswordHashById).mockResolvedValueOnce(mockUserWithPassword as never);
            vi.mocked(verifyPassword).mockResolvedValueOnce(true);
            vi.mocked(hashPassword).mockResolvedValueOnce('$argon2id$newpasswordhash');
            vi.mocked(updateUserRepository).mockResolvedValueOnce(updatedUserRow as never);

            await updatePassword('user-123', 'actor-123', MOCK_UPDATE_PASSWORD_INPUT);

            expect(findProfileByUserId).toHaveBeenCalledWith(expect.anything(), 'user-123');
            expect(findUserWithPasswordHashById).toHaveBeenCalledWith(expect.anything(), 'org-123', 'user-123');
            expect(verifyPassword).toHaveBeenCalledWith('$argon2id$currentpasswordhash', 'CurrentPassword123!');
            expect(hashPassword).toHaveBeenCalledWith('NewPassword123!');
            expect(updateUserRepository).toHaveBeenCalledWith(
                expect.anything(),
                'org-123',
                'user-123',
                {},
                '$argon2id$newpasswordhash',
            );

            expect(ActivityLogService.logProfilePasswordChanged).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
            expect(AuditLogService.logProfilePasswordChanged).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'actor-123', client: expect.anything() },
                { userId: 'user-123' },
            );
        });
    });

    describe('when profile is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findProfileByUserId).mockResolvedValueOnce(null);

            await expect(
                updatePassword('nonexistent-user', 'actor-123', MOCK_UPDATE_PASSWORD_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(findUserWithPasswordHashById).not.toHaveBeenCalled();
        });
    });

    describe('when user is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findProfileByUserId).mockResolvedValueOnce(MOCK_PROFILE_DETAILS as never);
            vi.mocked(findUserWithPasswordHashById).mockResolvedValueOnce(null);

            await expect(
                updatePassword('user-123', 'actor-123', MOCK_UPDATE_PASSWORD_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(verifyPassword).not.toHaveBeenCalled();
        });
    });

    describe('when current password verification fails', () => {
        it('throws UnauthorizedError', async () => {
            const mockUserWithPassword = {
                id: 'user-123',
                email: 'user@example.com',
                passwordHash: '$argon2id$currentpasswordhash',
            };

            vi.mocked(findProfileByUserId).mockResolvedValueOnce(MOCK_PROFILE_DETAILS as never);
            vi.mocked(findUserWithPasswordHashById).mockResolvedValueOnce(mockUserWithPassword as never);
            vi.mocked(verifyPassword).mockResolvedValueOnce(false);

            await expect(
                updatePassword('user-123', 'actor-123', MOCK_UPDATE_PASSWORD_INPUT),
            ).rejects.toThrow(UnauthorizedError);

            expect(hashPassword).not.toHaveBeenCalled();
            expect(updateUserRepository).not.toHaveBeenCalled();
        });
    });

    describe('when updateUserRepository returns null', () => {
        it('throws NotFoundError', async () => {
            const mockUserWithPassword = {
                id: 'user-123',
                email: 'user@example.com',
                passwordHash: '$argon2id$currentpasswordhash',
            };

            vi.mocked(findProfileByUserId).mockResolvedValueOnce(MOCK_PROFILE_DETAILS as never);
            vi.mocked(findUserWithPasswordHashById).mockResolvedValueOnce(mockUserWithPassword as never);
            vi.mocked(verifyPassword).mockResolvedValueOnce(true);
            vi.mocked(hashPassword).mockResolvedValueOnce('$argon2id$newpasswordhash');
            vi.mocked(updateUserRepository).mockResolvedValueOnce(null);

            await expect(
                updatePassword('user-123', 'actor-123', MOCK_UPDATE_PASSWORD_INPUT),
            ).rejects.toThrow(NotFoundError);

            expect(ActivityLogService.logProfilePasswordChanged).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates failure', async () => {
            vi.mocked(findProfileByUserId).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(
                updatePassword('user-123', 'actor-123', MOCK_UPDATE_PASSWORD_INPUT),
            ).rejects.toThrow('Database unavailable');
        });
    });
});
