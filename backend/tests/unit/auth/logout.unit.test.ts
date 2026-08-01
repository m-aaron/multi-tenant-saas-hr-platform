import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb } from '#tests/mocks/database.mock.js';

// ---------------------------------------------------------------------------
// Module Mocks — hoisted by Vitest
// ---------------------------------------------------------------------------

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#databases/transaction.js', () => ({
    withTransaction: vi.fn((cb: (client: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock('#modules/auth/services/jwt.service.js', () => ({
    verifyRefreshToken: vi.fn(),
}));

vi.mock('#modules/session/repositories/session.repository.js', () => ({
    findSessionById: vi.fn(),
}));

vi.mock('#modules/auth/repositories/auth.repository.js', () => ({
    revokeSession: vi.fn(),
    revokeAllSessions: vi.fn(),
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logAuthLogout: vi.fn().mockResolvedValue(undefined),
        logAuthLogoutAll: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import { logout, logoutAllSessions } from '#modules/auth/services/auth.service.js';
import { verifyRefreshToken } from '#modules/auth/services/jwt.service.js';
import { findSessionById } from '#modules/session/repositories/session.repository.js';
import { revokeSession, revokeAllSessions } from '#modules/auth/repositories/auth.repository.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

import { MOCK_JWT_PAYLOAD, MOCK_SESSION } from '#tests/helpers/test-auth-fixture.js';

// ---------------------------------------------------------------------------
// Tests: logout() and logoutAllSessions()
// ---------------------------------------------------------------------------

describe('logout()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid refresh token is provided', () => {
        it('revokes the session and logs auth_logout audit event', async () => {
            const validSession = MOCK_SESSION({ expiresAt: new Date(Date.now() + 100000) });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(validSession as never);
            vi.mocked(revokeSession).mockResolvedValueOnce(undefined as never);

            await logout('valid-refresh-token');

            expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
            expect(findSessionById).toHaveBeenCalledWith(expect.anything(), 'session-123');
            expect(revokeSession).toHaveBeenCalledWith(expect.anything(), 'session-123');
            expect(AuditLogService.logAuthLogout).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'user-123', client: expect.anything() },
                { userId: 'user-123' },
            );
        });
    });

    describe('when refresh token is invalid or expired JWT', () => {
        it('throws UnauthorizedError when verifyRefreshToken fails', async () => {
            vi.mocked(verifyRefreshToken).mockImplementationOnce(() => {
                throw new UnauthorizedError('Invalid or expired refresh token.');
            });

            await expect(logout('invalid-token')).rejects.toThrow(UnauthorizedError);
            expect(findSessionById).not.toHaveBeenCalled();
            expect(revokeSession).not.toHaveBeenCalled();
        });
    });

    describe('when session is not found in database', () => {
        it('throws UnauthorizedError', async () => {
            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(null);

            await expect(logout('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
            expect(revokeSession).not.toHaveBeenCalled();
        });
    });

    describe('when session is already revoked', () => {
        it('throws UnauthorizedError', async () => {
            const revokedSession = MOCK_SESSION({
                revokedAt: new Date('2026-01-02T00:00:00.000Z'),
                expiresAt: new Date(Date.now() + 100000),
            });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(revokedSession as never);

            await expect(logout('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
            expect(revokeSession).not.toHaveBeenCalled();
        });
    });

    describe('when session has expired', () => {
        it('throws UnauthorizedError', async () => {
            const expiredSession = MOCK_SESSION({
                expiresAt: new Date('2020-01-01T00:00:00.000Z'),
            });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(expiredSession as never);

            await expect(logout('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
            expect(revokeSession).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates database error', async () => {
            const validSession = MOCK_SESSION({ expiresAt: new Date(Date.now() + 100000) });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(validSession as never);
            vi.mocked(revokeSession).mockRejectedValueOnce(new Error('Database failure'));

            await expect(logout('valid-refresh-token')).rejects.toThrow('Database failure');
        });
    });
});

describe('logoutAllSessions()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when organizationId and userId are provided', () => {
        it('revokes all sessions for user and logs auth_logout_all audit event', async () => {
            vi.mocked(revokeAllSessions).mockResolvedValueOnce(undefined as never);

            await logoutAllSessions('org-123', 'user-123');

            expect(revokeAllSessions).toHaveBeenCalledWith(expect.anything(), 'user-123');
            expect(AuditLogService.logAuthLogoutAll).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'user-123', client: expect.anything() },
                { userId: 'user-123' },
            );
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates database error', async () => {
            vi.mocked(revokeAllSessions).mockRejectedValueOnce(new Error('Database error'));

            await expect(logoutAllSessions('org-123', 'user-123')).rejects.toThrow('Database error');
        });
    });
});
