import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#helpers/test-request.helper.js';
import { testPool } from '#tests/setup.js';
import {
    cleanupOrg,
    getLatestActivityLog,
    getLatestAuditLog,
    getOrgId,
    getUserId,
    setUserRole
} from '#helpers/test-database.helper.js';
import {
    expectForbiddenResponse,
    expectSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-org-${TEST_ID}`;
const ORG_NAME = `Test Organization ${TEST_ID}`;
const OWNER_EMAIL = `owner-org-${TEST_ID}@example.com`;
const PASSWORD = 'Password123';

const REGISTER_PAYLOAD = {
    name: ORG_NAME,
    slug: ORG_SLUG,
    ownerEmail: OWNER_EMAIL,
    password: PASSWORD,
    firstName: 'Jane',
    lastName: 'Doe',
};

let orgId: string;
let userId: string;
let accessToken: string;


// ---------------------------------------------------------------------------
// Setup / teardown — each test gets a completely fresh org + session
// ---------------------------------------------------------------------------

beforeEach(async () => {
    await cleanupOrg(ORG_SLUG);

    await api.post('/api/v1/auth/register').send(REGISTER_PAYLOAD);

    orgId = await getOrgId(ORG_SLUG);
    userId = await getUserId(orgId);

    const loginResponse = await api
        .post('/api/v1/auth/login')
        .send({
            organizationSlug: ORG_SLUG,
            email: OWNER_EMAIL,
            password: PASSWORD,
        });

    accessToken = loginResponse.body.data.tokens.accessToken as string;
});

afterEach(async () => {
    await cleanupOrg(ORG_SLUG);
});


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/organizations/me
// ---------------------------------------------------------------------------

describe('GET /api/v1/organizations/me', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when authenticated with allowed roles', () => {

        it('returns 200 with the organization details for owner', async () => {
            const response = await api
                .get('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);

            const org = response.body.data;
            expect(org.id).toBe(orgId);
            expect(org.name).toBe(ORG_NAME);
            expect(org.slug).toBe(ORG_SLUG);
            expect(org.createdAt).toBeDefined();
            expect(org.updatedAt).toBeDefined();
        });

        it('returns 200 with the organization details for administrator', async () => {
            await setUserRole(orgId, userId, 'administrator');

            const response = await api
                .get('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data.id).toBe(orgId);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get('/api/v1/organizations/me');

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 401 when access token is invalid', async () => {
            const response = await api
                .get('/api/v1/organizations/me')
                .set('Authorization', 'Bearer invalid.token.string');

            expectUnauthorizedResponse(response, /invalid or expired access token/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });


    // -------------------------------------------------------------------------
    // Organization status invalid
    // -------------------------------------------------------------------------

    describe('when organization status is invalid', () => {

        it('returns 401 when organization is marked as deleted', async () => {
            await testPool.query(
                'UPDATE organizations SET deleted_at = NOW() WHERE id = $1',
                [orgId],
            );

            const response = await api
                .get('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`);

            expectUnauthorizedResponse(response, /organization has been deleted/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: PATCH /api/v1/organizations/me
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/organizations/me', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('updates an organization and records persistence, activity, and audit side effects', async () => {
            const newName = `Updated Org Name ${crypto.randomUUID()}`;

            const response = await api
                .patch('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: newName });

            expectSuccessResponse(response, 200);
            expect(response.body.data.name).toBe(newName);

            const dbResult = await testPool.query<{ name: string }>(
                'SELECT name FROM organizations WHERE id = $1',
                [orgId],
            );
            expect(dbResult.rows[0]!.name).toBe(newName);

            const activityLog = await getLatestActivityLog(orgId, 'organization.updated');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'updated');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('organization');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when name field is missing', async () => {
            const response = await api
                .patch('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expectValidationErrorResponse(response);
        });

        it('returns 400 when name is shorter than 3 characters', async () => {
            const response = await api
                .patch('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'AB' });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api
                .patch('/api/v1/organizations/me')
                .send({ name: 'Valid New Name' });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .patch('/api/v1/organizations/me')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Valid New Name' });

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});
