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
    updateSessionRefreshToken: vi.fn(),
}));

vi.mock('#modules/auth/utils/auth.util.js', () => ({
    compareRefreshTokenHash: vi.fn(),
}));

vi.mock('#modules/session/services/session.service.js', () => ({
    issueSession: vi.fn(),
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import { refresh } from '#modules/auth/services/auth.service.js';
import { verifyRefreshToken } from '#modules/auth/services/jwt.service.js';
import { findSessionById, updateSessionRefreshToken } from '#modules/session/repositories/session.repository.js';
import { compareRefreshTokenHash } from '#modules/auth/utils/auth.util.js';
import { issueSession } from '#modules/session/services/session.service.js';
import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

import {
    MOCK_TOKENS,
    MOCK_JWT_PAYLOAD,
    MOCK_SESSION,
    MOCK_ISSUED_SESSION,
} from '#tests/helpers/test-auth-fixture.js';

const expiresAt = new Date('2026-12-31T23:59:59.000Z');

// ---------------------------------------------------------------------------
// Tests: refresh()
// ---------------------------------------------------------------------------

describe('refresh()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid refresh token is supplied', () => {
        it('verifies token, validates active session, updates session in DB, and returns new tokens', async () => {
            const validSession = MOCK_SESSION({ expiresAt: new Date(Date.now() + 100000) });
            const newIssuedSession = MOCK_ISSUED_SESSION(expiresAt);

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(validSession as never);
            vi.mocked(compareRefreshTokenHash).mockResolvedValueOnce(true);
            vi.mocked(issueSession).mockResolvedValueOnce(newIssuedSession as never);
            vi.mocked(updateSessionRefreshToken).mockResolvedValueOnce(undefined as never);

            const result = await refresh('valid-refresh-token');

            expect(result).toEqual(MOCK_TOKENS);
            expect(verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
            expect(findSessionById).toHaveBeenCalledWith(expect.anything(), 'session-123');
            expect(compareRefreshTokenHash).toHaveBeenCalledWith('hash-123', 'valid-refresh-token');
            expect(issueSession).toHaveBeenCalledWith({
                sid: 'session-123',
                sub: 'user-123',
                organizationId: 'org-123',
                roleId: 'role-123',
            });
            expect(updateSessionRefreshToken).toHaveBeenCalledWith(expect.anything(), {
                sessionId: 'session-123',
                refreshTokenHash: newIssuedSession.refreshTokenHash,
                expiresAt: newIssuedSession.expiresAt,
                lastUsedAt: expect.any(Date),
            });
        });
    });

    describe('when refresh token is invalid or unparseable JWT', () => {
        it('throws UnauthorizedError when verifyRefreshToken fails', async () => {
            vi.mocked(verifyRefreshToken).mockImplementationOnce(() => {
                throw new UnauthorizedError('Invalid or expired refresh token.');
            });

            await expect(refresh('invalid-token')).rejects.toThrow(UnauthorizedError);
            expect(findSessionById).not.toHaveBeenCalled();
        });
    });

    describe('when session is not found in database', () => {
        it('throws UnauthorizedError', async () => {
            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(null);

            await expect(refresh('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
            expect(compareRefreshTokenHash).not.toHaveBeenCalled();
        });
    });

    describe('when session has been revoked', () => {
        it('throws UnauthorizedError', async () => {
            const revokedSession = MOCK_SESSION({
                revokedAt: new Date('2026-01-02T00:00:00.000Z'),
                expiresAt: new Date(Date.now() + 100000),
            });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(revokedSession as never);

            await expect(refresh('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
            expect(compareRefreshTokenHash).not.toHaveBeenCalled();
        });
    });

    describe('when session has expired', () => {
        it('throws UnauthorizedError', async () => {
            const expiredSession = MOCK_SESSION({
                expiresAt: new Date('2020-01-01T00:00:00.000Z'),
            });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(expiredSession as never);

            await expect(refresh('valid-refresh-token')).rejects.toThrow(UnauthorizedError);
            expect(compareRefreshTokenHash).not.toHaveBeenCalled();
        });
    });

    describe('when refresh token hash does not match', () => {
        it('throws UnauthorizedError', async () => {
            const validSession = MOCK_SESSION({ expiresAt: new Date(Date.now() + 100000) });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(validSession as never);
            vi.mocked(compareRefreshTokenHash).mockResolvedValueOnce(false);

            await expect(refresh('mismatched-refresh-token')).rejects.toThrow(UnauthorizedError);
            expect(issueSession).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository or session update errors', async () => {
            const validSession = MOCK_SESSION({ expiresAt: new Date(Date.now() + 100000) });

            vi.mocked(verifyRefreshToken).mockReturnValueOnce(MOCK_JWT_PAYLOAD as never);
            vi.mocked(findSessionById).mockResolvedValueOnce(validSession as never);
            vi.mocked(compareRefreshTokenHash).mockResolvedValueOnce(true);
            vi.mocked(issueSession).mockResolvedValueOnce(MOCK_ISSUED_SESSION(expiresAt) as never);
            vi.mocked(updateSessionRefreshToken).mockRejectedValueOnce(new Error('Database unavailable'));

            await expect(refresh('valid-refresh-token')).rejects.toThrow('Database unavailable');
        });
    });
});
