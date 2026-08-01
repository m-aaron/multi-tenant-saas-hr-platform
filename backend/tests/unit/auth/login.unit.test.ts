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
    findOrganizationBySlug: vi.fn(),
}));

vi.mock('#modules/auth/repositories/auth.repository.js', () => ({
    findUserForLogin: vi.fn(),
}));

vi.mock('#modules/session/repositories/session.repository.js', () => ({
    createSession: vi.fn(),
}));

vi.mock('#shared/utils/password.util.js', () => ({
    verifyPassword: vi.fn(),
}));

vi.mock('#shared/utils/uuid.util.js', () => ({
    generateUuid: vi.fn(),
}));

vi.mock('#modules/session/services/session.service.js', () => ({
    issueSession: vi.fn(),
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logAuthLogin: vi.fn().mockResolvedValue(undefined),
        logAuthLoginFailed: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import { login } from '#modules/auth/services/auth.service.js';
import { findOrganizationBySlug } from '#modules/organization/repositories/organization.repository.js';
import { findUserForLogin } from '#modules/auth/repositories/auth.repository.js';
import { createSession } from '#modules/session/repositories/session.repository.js';
import { verifyPassword } from '#shared/utils/password.util.js';
import { generateUuid } from '#shared/utils/uuid.util.js';
import { issueSession } from '#modules/session/services/session.service.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';
import { ForbiddenError } from '#shared/errors/forbidden-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

import {
    MOCK_INPUT,
    MOCK_ORG,
    MOCK_USER,
    MOCK_TOKENS,
    MOCK_ISSUED_SESSION
} from '#tests/helpers/test-auth-fixture.js';


const expiresAt = new Date('2026-12-31T23:59:59.000Z');

// ---------------------------------------------------------------------------
// Tests: login()
// ---------------------------------------------------------------------------

describe('login()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });


    describe('when valid credentials and active account are supplied', () => {
        it('authenticates user, creates session, logs audit, and returns user profile with tokens', async () => {
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(MOCK_ORG as never);
            vi.mocked(findUserForLogin).mockResolvedValueOnce(MOCK_USER as never);
            vi.mocked(verifyPassword).mockResolvedValueOnce(true);
            vi.mocked(generateUuid).mockReturnValueOnce('session-123');
            vi.mocked(issueSession).mockResolvedValueOnce(MOCK_ISSUED_SESSION(expiresAt) as never);
            vi.mocked(createSession).mockResolvedValueOnce(undefined as never);

            const result = await login(MOCK_INPUT);

            expect(result).toEqual({
                user: {
                    id: 'user-123',
                    organizationId: 'org-123',
                    employeeId: 'emp-123',
                    roleId: 'role-123',
                    email: 'user@example.com',
                },
                tokens: MOCK_TOKENS,
            });

            expect(createSession).toHaveBeenCalledWith(expect.anything(), {
                id: 'session-123',
                organizationId: 'org-123',
                userId: 'user-123',
                refreshTokenHash: 'hash-123',
                expiresAt: expiresAt,
            });

            expect(AuditLogService.logAuthLogin).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'user-123', client: expect.anything() },
                { userId: 'user-123', email: 'user@example.com' },
            );
        });
    });


    describe('when user is not found', () => {
        it('logs login_failed audit entry with organization context and throws UnauthorizedError', async () => {
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(MOCK_ORG as never);
            vi.mocked(findUserForLogin).mockResolvedValueOnce(null);

            await expect(login(MOCK_INPUT)).rejects.toThrow(UnauthorizedError);

            expect(AuditLogService.logAuthLoginFailed).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: null },
                { email: 'user@example.com', reason: 'User not found.' },
            );
        });

        it('throws UnauthorizedError without logging audit if organization is also not found', async () => {
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(null);
            vi.mocked(findUserForLogin).mockResolvedValueOnce(null);

            await expect(login(MOCK_INPUT)).rejects.toThrow(UnauthorizedError);

            expect(AuditLogService.logAuthLoginFailed).not.toHaveBeenCalled();
        });

        it('logs login_failed audit entry if user has no passwordHash and throws UnauthorizedError', async () => {
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(MOCK_ORG as never);
            vi.mocked(findUserForLogin).mockResolvedValueOnce({
                ...MOCK_USER,
                passwordHash: null,
            } as never);

            await expect(login(MOCK_INPUT)).rejects.toThrow(UnauthorizedError);

            expect(AuditLogService.logAuthLoginFailed).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: null },
                { email: 'user@example.com', reason: 'User not found.' },
            );
        });
    });


    describe('when password verification fails', () => {
        it('logs login_failed audit entry with actorId and throws UnauthorizedError', async () => {
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(MOCK_ORG as never);
            vi.mocked(findUserForLogin).mockResolvedValueOnce(MOCK_USER as never);
            vi.mocked(verifyPassword).mockResolvedValueOnce(false);

            await expect(login(MOCK_INPUT)).rejects.toThrow(UnauthorizedError);

            expect(AuditLogService.logAuthLoginFailed).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'user-123' },
                { email: 'user@example.com', reason: 'Invalid password.' },
            );
        });
    });


    describe('when user account status is not active', () => {
        it('logs login_failed audit entry with actorId and throws ForbiddenError', async () => {
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(MOCK_ORG as never);
            vi.mocked(findUserForLogin).mockResolvedValueOnce({
                ...MOCK_USER,
                status: 'inactive',
            } as never);
            vi.mocked(verifyPassword).mockResolvedValueOnce(true);

            await expect(login(MOCK_INPUT)).rejects.toThrow(ForbiddenError);

            expect(AuditLogService.logAuthLoginFailed).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'user-123' },
                { email: 'user@example.com', reason: 'User account is not active.' },
            );
        });

        it('throws ForbiddenError without logging audit if organization is null', async () => {
            vi.mocked(findOrganizationBySlug).mockResolvedValueOnce(null);
            vi.mocked(findUserForLogin).mockResolvedValueOnce({
                ...MOCK_USER,
                status: 'inactive',
            } as never);
            vi.mocked(verifyPassword).mockResolvedValueOnce(true);

            await expect(login(MOCK_INPUT)).rejects.toThrow(ForbiddenError);

            expect(AuditLogService.logAuthLoginFailed).not.toHaveBeenCalled();
        });
    });

    
    describe('when infrastructure dependencies fail', () => {
        it('propagates repository failures', async () => {
            vi.mocked(findOrganizationBySlug)
                .mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(login(MOCK_INPUT))
                .rejects
                .toThrow('Database unavailable');
        });

        it('propagates session creation failures', async () => {
            vi.mocked(findOrganizationBySlug)
                .mockResolvedValueOnce(MOCK_ORG as never);

            vi.mocked(findUserForLogin)
                .mockResolvedValueOnce(MOCK_USER as never);

            vi.mocked(verifyPassword)
                .mockResolvedValueOnce(true);

            vi.mocked(generateUuid)
                .mockReturnValueOnce('session-123');

            vi.mocked(issueSession)
                .mockResolvedValueOnce(MOCK_ISSUED_SESSION as never);

            vi.mocked(createSession)
                .mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(login(MOCK_INPUT))
                .rejects
                .toThrow('Database unavailable');
        });
    });
});