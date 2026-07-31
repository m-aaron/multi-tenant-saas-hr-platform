import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#tests/helpers/test-request.helper.js';
import { testPool } from '#tests/setup.js';
import {
    cleanupOrg,
    getLatestAuditLog,
    getOrgId,
    getSession,
    getUserId,
} from '#tests/helpers/test-database.helper.js';
import {
    expectNullDataSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#tests/helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-logout-${TEST_ID}`;
const ORG_NAME = `Test Logout Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-logout-${TEST_ID}@example.com`;
const PASSWORD = 'Password123';

const REGISTER_PAYLOAD = {
    name: ORG_NAME,
    slug: ORG_SLUG,
    ownerEmail: OWNER_EMAIL,
    password: PASSWORD,
    firstName: 'Bob',
    lastName: 'Jones',
};

// Set in beforeEach — available to all tests in this file
let userId: string;
let orgId: string;


// ---------------------------------------------------------------------------
// Local helper: login and return both tokens + the created session id
// ---------------------------------------------------------------------------

async function loginAndGetTokens(): Promise<{
    accessToken: string;
    refreshToken: string;
    sessionId: string;
}> {
    const loginResponse = await api
        .post('/api/v1/auth/login')
        .send({
            organizationSlug: ORG_SLUG,
            email: OWNER_EMAIL,
            password: PASSWORD,
        });

    const { accessToken, refreshToken } = loginResponse.body.data.tokens;
    const uid = loginResponse.body.data.user.id as string;

    // Look up the session that was just created
    const sessionResult = await testPool.query<{ id: string }>(
        `SELECT id FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [uid],
    );

    return {
        accessToken,
        refreshToken,
        sessionId: sessionResult.rows[0]!.id,
    };
}


// ---------------------------------------------------------------------------
// Setup / teardown — each test gets a completely fresh org
// ---------------------------------------------------------------------------

beforeEach(async () => {
    await cleanupOrg(ORG_SLUG); // safe no-op on the first run
    await api.post('/api/v1/auth/register').send(REGISTER_PAYLOAD);
    orgId = await getOrgId(ORG_SLUG);
    userId = await getUserId(orgId);
});

afterEach(async () => {
    await cleanupOrg(ORG_SLUG);
});


// ---------------------------------------------------------------------------
// Tests: POST /api/v1/auth/logout (single session)
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/logout', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid refresh token is supplied', () => {

        it('logs out current session and verifies null data response, session revocation in database, and audit log side effects', async () => {
            const { refreshToken, sessionId } = await loginAndGetTokens();

            const response = await api
                .post('/api/v1/auth/logout')
                .send({ refreshToken });

            expectNullDataSuccessResponse(response, 200);

            // DB: session must now be revoked
            const session = await getSession(sessionId);
            expect(session.revoked_at).not.toBeNull();

            // Audit log: logout entry created
            const log = await getLatestAuditLog(orgId, 'logout');
            expect(log).toBeDefined();
            expect(log!.actor_id).toBe(userId);
        });
    });


    // -------------------------------------------------------------------------
    // Error cases — 401
    // -------------------------------------------------------------------------

    describe('when the refresh token is invalid', () => {

        it('returns 401 on a double-logout (already-revoked token)', async () => {
            const { refreshToken } = await loginAndGetTokens();

            // First logout succeeds
            await api.post('/api/v1/auth/logout').send({ refreshToken });

            // Second logout must fail
            const response = await api
                .post('/api/v1/auth/logout')
                .send({ refreshToken });

            expectUnauthorizedResponse(response);
        });

        it('returns 401 when the token string is malformed', async () => {
            const response = await api
                .post('/api/v1/auth/logout')
                .send({ refreshToken: 'not.a.valid.jwt' });

            expectUnauthorizedResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Validation errors — 400
    // -------------------------------------------------------------------------

    describe('when required fields are missing', () => {

        it('returns 400 when refreshToken field is absent', async () => {
            const response = await api
                .post('/api/v1/auth/logout')
                .send({});

            expectValidationErrorResponse(response);
        });

        it('returns 400 when refreshToken is an empty string', async () => {
            const response = await api
                .post('/api/v1/auth/logout')
                .send({ refreshToken: '' });

            expectValidationErrorResponse(response);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: POST /api/v1/auth/logout-all
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/logout-all', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid access token is supplied', () => {

        it('logs out all sessions for the user and verifies null data response, all sessions revoked in database, and logout_all audit log side effects', async () => {
            const session1 = await loginAndGetTokens();
            const session2 = await loginAndGetTokens();

            const response = await api
                .post('/api/v1/auth/logout-all')
                .set('Authorization', `Bearer ${session1.accessToken}`);

            expectNullDataSuccessResponse(response, 200);

            // DB: both sessions must now be revoked
            const [s1, s2] = await Promise.all([
                getSession(session1.sessionId),
                getSession(session2.sessionId),
            ]);
            expect(s1.revoked_at).not.toBeNull();
            expect(s2.revoked_at).not.toBeNull();

            // Audit log: logout_all entry created
            const log = await getLatestAuditLog(orgId, 'logout_all');
            expect(log).toBeDefined();
            expect(log!.actor_id).toBe(userId);
        });
    });


    // -------------------------------------------------------------------------
    // Error cases — 401
    // -------------------------------------------------------------------------

    describe('when the Authorization header is missing or invalid', () => {

        it('returns 401 when the Authorization header is absent', async () => {
            const response = await api
                .post('/api/v1/auth/logout-all');

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 401 when the access token is invalid', async () => {
            const response = await api
                .post('/api/v1/auth/logout-all')
                .set('Authorization', 'Bearer this.is.not.valid');

            expectUnauthorizedResponse(response, /invalid or expired access token/i);
        });

        it('returns 401 when the Authorization header is not a Bearer token', async () => {
            const response = await api
                .post('/api/v1/auth/logout-all')
                .set('Authorization', 'Basic dXNlcjpwYXNz');

            expectUnauthorizedResponse(response);
        });
    });
});
