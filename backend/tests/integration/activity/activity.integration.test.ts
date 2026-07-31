import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#tests/helpers/test-request.helper.js';
import {
    cleanupOrg,
    getLatestActivityLog,
    getOrgId,
    getUserId,
    setUserRole
} from '#tests/helpers/test-database.helper.js';
import {
    expectErrorResponse,
    expectForbiddenResponse,
    expectSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#tests/helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-act-${TEST_ID}`;
const ORG_NAME = `Test Activity Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-act-${TEST_ID}@example.com`;
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


async function triggerDepartmentActivity(name = `Dept ${crypto.randomUUID()}`): Promise<void> {
    const response = await api
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name });

    expectSuccessResponse(response, 201);
}


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/activities
// ---------------------------------------------------------------------------

describe('GET /api/v1/activities', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when authenticated with allowed roles', () => {

        it('returns 200 with paginated activity logs for the organization', async () => {
            const deptName = `Engineering ${crypto.randomUUID()}`;
            await triggerDepartmentActivity(deptName);

            const response = await api
                .get('/api/v1/activities')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);

            const paginatedData = response.body.data;
            expect(Array.isArray(paginatedData.items)).toBe(true);
            expect(paginatedData.page).toBe(1);
            expect(paginatedData.limit).toBe(20);
            expect(paginatedData.total).toBeGreaterThanOrEqual(1);

            const eventTypes = paginatedData.items.map(
                (item: { eventType: string }) => item.eventType,
            );
            expect(eventTypes).toContain('department.created');
        });

        it('supports custom pagination parameters', async () => {
            await triggerDepartmentActivity();

            const response = await api
                .get('/api/v1/activities?page=1&limit=5')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data.page).toBe(1);
            expect(response.body.data.limit).toBe(5);
        });

        it('returns 200 for hr_manager role', async () => {
            await setUserRole(orgId, userId, 'hr_manager');

            const response = await api
                .get('/api/v1/activities')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when query validation fails (400)', () => {

        it('returns 400 when page is less than 1', async () => {
            const response = await api
                .get('/api/v1/activities?page=0')
                .set('Authorization', `Bearer ${accessToken}`);

            expectValidationErrorResponse(response);
        });

        it('returns 400 when limit exceeds 100', async () => {
            const response = await api
                .get('/api/v1/activities?limit=101')
                .set('Authorization', `Bearer ${accessToken}`);

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get('/api/v1/activities');

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get('/api/v1/activities')
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/activities/:activityId
// ---------------------------------------------------------------------------

describe('GET /api/v1/activities/:activityId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when the activity log exists', () => {

        it('returns 200 with activity log details when activity exists', async () => {
            await triggerDepartmentActivity();

            const latestLog = await getLatestActivityLog(orgId, 'department.created');
            expect(latestLog).toBeDefined();

            const activityId = latestLog!.id;

            const response = await api
                .get(`/api/v1/activities/${activityId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);

            const activityLog = response.body.data;
            expect(activityLog.id).toBe(activityId);
            expect(activityLog.eventType).toBe('department.created');
            expect(activityLog.actorId).toBe(userId);
            expect(activityLog.organizationId).toBe(orgId);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when the activity log does not exist', () => {

        it('returns 404 for an unknown activity log ID', async () => {
            const response = await api
                .get(`/api/v1/activities/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectErrorResponse(response, 404, /activity log not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get(`/api/v1/activities/${crypto.randomUUID()}`);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get(`/api/v1/activities/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});
