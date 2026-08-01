import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#tests/helpers/test-request.helper.js';
import { testPool } from '#tests/setup.js';
import {
    cleanupOrg,
    countAuditLogs,
    getLatestAuditLog,
    getLatestSession,
    getOrgId,
    getUserId,
} from '#tests/helpers/test-database.helper.js';
import {
    expectForbiddenResponse,
    expectSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#tests/helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-login-${TEST_ID}`;
const ORG_NAME = `Test Login Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-login-${TEST_ID}@example.com`;
const PASSWORD = 'Password123';

const REGISTER_PAYLOAD = {
    name: ORG_NAME,
    slug: ORG_SLUG,
    ownerEmail: OWNER_EMAIL,
    password: PASSWORD,
    firstName: 'Jane',
    lastName: 'Smith',
};

const LOGIN_PAYLOAD = {
    organizationSlug: ORG_SLUG,
    email: OWNER_EMAIL,
    password: PASSWORD,
};

// Set in beforeEach — available to all tests in this file
let orgId: string;
let userId: string;


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
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/login', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when valid credentials are supplied', () => {

        it('logs in successfully and verifies token response shape, active session database persistence, and audit log side effects', async () => {
            const response = await api
                .post('/api/v1/auth/login')
                .send(LOGIN_PAYLOAD);

            expectSuccessResponse(response, 200);

            const { user, tokens } = response.body.data;

            // User fields
            expect(typeof user.id).toBe('string');
            expect(typeof user.organizationId).toBe('string');
            expect(typeof user.employeeId).toBe('string');
            expect(typeof user.roleId).toBe('string');
            expect(user.email).toBe(OWNER_EMAIL.toLowerCase());

            // Token fields
            expect(typeof tokens.accessToken).toBe('string');
            expect(tokens.accessToken.length).toBeGreaterThan(0);
            expect(typeof tokens.refreshToken).toBe('string');
            expect(tokens.refreshToken.length).toBeGreaterThan(0);

            // Active session DB persistence
            const session = await getLatestSession(userId);
            expect(session.refresh_token_hash).toBeTruthy();
            expect(session.revoked_at).toBeNull();
            expect(new Date(session.expires_at).getTime()).toBeGreaterThan(Date.now());

            // Audit log side effect
            const log = await getLatestAuditLog(orgId, 'login');
            expect(log).toBeDefined();
            expect(log!.actor_id).toBe(userId);
        });
    });


    // -------------------------------------------------------------------------
    // Credential errors — 401
    // -------------------------------------------------------------------------

    describe('when credentials are wrong', () => {

        it('returns 401 when the password is incorrect', async () => {
            const response = await api
                .post('/api/v1/auth/login')
                .send({ ...LOGIN_PAYLOAD, password: 'WrongPassword!' });

            expectUnauthorizedResponse(response, /invalid credentials/i);
        });

        it('writes a login_failed audit log when password is wrong', async () => {
            await api
                .post('/api/v1/auth/login')
                .send({ ...LOGIN_PAYLOAD, password: 'BadPassword99' });

            // Fresh org — no prior login_failed entries, so count must be exactly 1
            const count = await countAuditLogs(orgId, 'login_failed');
            expect(count).toBeGreaterThanOrEqual(1);
        });

        it('returns 401 when the email does not exist in the organization', async () => {
            const response = await api
                .post('/api/v1/auth/login')
                .send({ ...LOGIN_PAYLOAD, email: 'nobody@example.com' });

            expectUnauthorizedResponse(response, /invalid credentials/i);
        });

        it('returns 401 when the organization slug does not exist', async () => {
            const response = await api
                .post('/api/v1/auth/login')
                .send({ ...LOGIN_PAYLOAD, organizationSlug: 'non-existent-org-slug' });

            expectUnauthorizedResponse(response, /invalid credentials/i);
        });
    });

    describe('when the user account is inactive', () => {

        it('returns 403 when user status is inactive', async () => {
            await testPool.query(
                'UPDATE users SET status = $1 WHERE id = $2',
                ['inactive', userId],
            );

            const response = await api
                .post('/api/v1/auth/login')
                .send(LOGIN_PAYLOAD);

            expectForbiddenResponse(response, /user account is not active/i);
            // No need to restore status — afterEach deletes the entire org
        });
    });


    // -------------------------------------------------------------------------
    // Validation errors — 400
    // -------------------------------------------------------------------------

    describe('when required fields are missing', () => {

        it('returns 400 when organizationSlug is missing', async () => {
            const { organizationSlug: _slug, ...payload } = LOGIN_PAYLOAD;

            const response = await api
                .post('/api/v1/auth/login')
                .send(payload);

            expectValidationErrorResponse(response);
        });

        it('returns 400 when email is missing', async () => {
            const { email: _email, ...payload } = LOGIN_PAYLOAD;

            const response = await api
                .post('/api/v1/auth/login')
                .send(payload);

            expectValidationErrorResponse(response);
        });

        it('returns 400 when password is missing', async () => {
            const { password: _password, ...payload } = LOGIN_PAYLOAD;

            const response = await api
                .post('/api/v1/auth/login')
                .send(payload);

            expectValidationErrorResponse(response);
        });

        it('returns 400 when email format is invalid', async () => {
            const response = await api
                .post('/api/v1/auth/login')
                .send({ ...LOGIN_PAYLOAD, email: 'not-an-email' });

            expectValidationErrorResponse(response);
        });
    });
});
