import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb } from '#tests/mocks/database.mock.js';

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#configs/env.js', () => ({
    env: {
        NODE_ENV: 'test',
        port: 4000,
        db: {
            host: 'localhost',
            port: 5432,
            name: 'test_db',
            user: 'test_user',
            password: 'test_password',
        },
        jwt: {
            accessTokenSecret: 'access-secret',
            accessTokenExpires: '15m',
            refreshTokenSecret: 'refresh-secret',
            refreshTokenExpires: '7d',
        },
    },
}));

import {
    performHealthCheck,
    type HealthCheckResponse,
} from '#modules/health/services/health.service.js';

const MOCK_UPTIME = 42.7;

const HEALTHY_QUERY = {
    rows: [{}],
    rowCount: 1,
};

const EMPTY_QUERY = {
    rows: [],
    rowCount: 0,
};

describe('performHealthCheck()', () => {
    let uptimeSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();

        uptimeSpy = vi
            .spyOn(process, 'uptime')
            .mockReturnValue(MOCK_UPTIME);
    });

    afterEach(() => {
        uptimeSpy.mockRestore();
    });

    describe('when the database connection is healthy', () => {
        it('returns a healthy response', async () => {
            vi.mocked(mockDb.query).mockResolvedValueOnce(
                HEALTHY_QUERY as never,
            );

            const result: HealthCheckResponse =
                await performHealthCheck();

            expect(result).toEqual({
                status: 'ok',
                database: 'connected',
                uptime: Math.floor(MOCK_UPTIME),
                environment: 'test',
            });
        });
    });

    describe('when the database returns zero rows', () => {
        it('returns an unhealthy response', async () => {
            vi.mocked(mockDb.query).mockResolvedValueOnce(
                EMPTY_QUERY as never,
            );

            const result = await performHealthCheck();

            expect(result).toEqual({
                status: 'unhealthy',
                database: 'disconnected',
                uptime: Math.floor(MOCK_UPTIME),
                environment: 'test',
            });
        });
    });

    describe('when the database throws an error', () => {
        it('returns an unhealthy response without throwing', async () => {
            vi.mocked(mockDb.query).mockRejectedValueOnce(
                new Error('ECONNREFUSED'),
            );

            await expect(
                performHealthCheck(),
            ).resolves.toEqual({
                status: 'unhealthy',
                database: 'disconnected',
                uptime: Math.floor(MOCK_UPTIME),
                environment: 'test',
            });
        });

        it('handles non-Error thrown values', async () => {
            vi.mocked(mockDb.query).mockRejectedValueOnce(
                'database failure',
            );

            const result = await performHealthCheck();

            expect(result.status).toBe('unhealthy');
            expect(result.database).toBe('disconnected');
        });
    });
});