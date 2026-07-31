import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#helpers/test-request.helper.js';
import {
    cleanupOrg,
    getLatestSession,
    getOrgId,
    getSession,
    getUserId,
} from '#helpers/test-database.helper.js';
import {
    expectSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-refresh-${TEST_ID}`;
const ORG_NAME = `Test Refresh Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-refresh-${TEST_ID}@example.com`;
const PASSWORD = 'Password123';

const REGISTER_PAYLOAD = {
    name: ORG_NAME,
    slug: ORG_SLUG,
    ownerEmail: OWNER_EMAIL,
    password: PASSWORD,
    firstName: 'Alice',
    lastName: 'Walker',
};

// Reset in beforeEach so every test starts from a clean login
let refreshToken: string;
let sessionId: string;
let originalHash: string;


// ---------------------------------------------------------------------------
// Setup / teardown — each test gets a completely fresh org + session
// ---------------------------------------------------------------------------

beforeEach(async () => {
    await cleanupOrg(ORG_SLUG); // safe no-op on first run

    await api.post('/api/v1/auth/register').send(REGISTER_PAYLOAD);

    const orgId = await getOrgId(ORG_SLUG);
    const userId = await getUserId(orgId);

    const loginResponse = await api
        .post('/api/v1/auth/login')
        .send({
            organizationSlug: ORG_SLUG,
            email: OWNER_EMAIL,
            password: PASSWORD,
        });

    refreshToken = loginResponse.body.data.tokens.refreshToken as string;

    const session = await getLatestSession(userId);
    sessionId = session.id;
    originalHash = session.refresh_token_hash;
});

afterEach(async () => {
    await cleanupOrg(ORG_SLUG);
});


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/refresh', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid refresh token is supplied', () => {

        it('refreshes tokens and verifies new token response, rotated refresh_token_hash, and updated last_used_at timestamp in database', async () => {
            const response = await api
                .post('/api/v1/auth/refresh')
                .send({ refreshToken });

            expectSuccessResponse(response, 200);

            const { accessToken, refreshToken: newRefreshToken } = response.body.data;

            expect(typeof accessToken).toBe('string');
            expect(accessToken.length).toBeGreaterThan(0);
            expect(typeof newRefreshToken).toBe('string');
            expect(newRefreshToken.length).toBeGreaterThan(0);
            expect(newRefreshToken).not.toBe(refreshToken);

            // DB session persistence & rotation checks
            const session = await getSession(sessionId);
            expect(session.refresh_token_hash).toBeTruthy();
            expect(session.refresh_token_hash).not.toBe(originalHash);
            expect(session.last_used_at).not.toBeNull();
        });
    });


    // -------------------------------------------------------------------------
    // Error cases — 401
    // -------------------------------------------------------------------------

    describe('when the refresh token is invalid or revoked', () => {

        it('returns 401 when the token string is malformed', async () => {
            const response = await api
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'this.is.not.a.valid.jwt' });

            expectUnauthorizedResponse(response, /invalid or expired refresh token/i);
        });

        it('returns 401 when the session has been revoked (post-logout)', async () => {
            // Revoke the session via logout, then try to refresh with the same token
            await api.post('/api/v1/auth/logout').send({ refreshToken });

            const response = await api
                .post('/api/v1/auth/refresh')
                .send({ refreshToken });

            expectUnauthorizedResponse(response, /invalid or expired refresh token/i);
        });
    });


    // -------------------------------------------------------------------------
    // Validation errors — 400
    // -------------------------------------------------------------------------

    describe('when required fields are missing', () => {

        it('returns 400 when refreshToken field is missing', async () => {
            const response = await api
                .post('/api/v1/auth/refresh')
                .send({});

            expectValidationErrorResponse(response);
        });

        it('returns 400 when refreshToken is an empty string', async () => {
            const response = await api
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: '' });

            expectValidationErrorResponse(response);
        });
    });
});
