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
    expectNullDataSuccessResponse,
    expectSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-profile-${TEST_ID}`;
const ORG_NAME = `Test Profile Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-profile-${TEST_ID}@example.com`;
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
// Tests: GET /api/v1/profile
// ---------------------------------------------------------------------------

describe('GET /api/v1/profile', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when authenticated', () => {

        it('returns 200 with profile details for the authenticated user', async () => {
            const response = await api
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);

            const profile = response.body.data;
            expect(profile.user.userId).toBe(userId);
            expect(profile.user.email).toBe(OWNER_EMAIL.toLowerCase());
            expect(profile.organization.organizationId).toBe(orgId);
            expect(profile.organization.organizationName).toBe(ORG_NAME);
            expect(profile.employee.firstName).toBe(REGISTER_PAYLOAD.firstName);
            expect(profile.employee.lastName).toBe(REGISTER_PAYLOAD.lastName);
            expect(profile.role.roleName).toBe('owner');
        });

        it('returns 200 for employee role', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get('/api/v1/profile')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data.user.userId).toBe(userId);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication fails (401)
    // -------------------------------------------------------------------------

    describe('when authentication fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get('/api/v1/profile');

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: PATCH /api/v1/profile
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/profile', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('updates profile avatar URL and records persistence, activity, and audit side effects', async () => {
            const newAvatarUrl = 'https://example.com/avatar.jpg';

            const response = await api
                .patch('/api/v1/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ avatarUrl: newAvatarUrl });

            expectSuccessResponse(response, 200);
            expect(response.body.data.avatarUrl).toBe(newAvatarUrl);

            const dbResult = await testPool.query<{ avatar_url: string }>(
                'SELECT avatar_url FROM profiles WHERE user_id = $1',
                [userId],
            );
            expect(dbResult.rows[0]!.avatar_url).toBe(newAvatarUrl);

            const activityLog = await getLatestActivityLog(orgId, 'profile.updated');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'updated');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('profile');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when avatarUrl is invalid URL format', async () => {
            const response = await api
                .patch('/api/v1/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ avatarUrl: 'invalid-url-string' });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication fails (401)
    // -------------------------------------------------------------------------

    describe('when authentication fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api
                .patch('/api/v1/profile')
                .send({ avatarUrl: 'https://example.com/avatar.jpg' });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: PATCH /api/v1/profile/password
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/profile/password', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when valid current and new passwords are supplied', () => {

        it('updates password and records authentication, activity, and audit side effects', async () => {
            const newPassword = 'NewPassword456!';

            const response = await api
                .patch('/api/v1/profile/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: PASSWORD,
                    newPassword,
                });

            expectNullDataSuccessResponse(response, 200);

            // Authentication verification: login succeeds with new password
            const loginResponse = await api
                .post('/api/v1/auth/login')
                .send({
                    organizationSlug: ORG_SLUG,
                    email: OWNER_EMAIL,
                    password: newPassword,
                });

            expectSuccessResponse(loginResponse, 200);

            const activityLog = await getLatestActivityLog(orgId, 'profile.password.changed');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'password_changed');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('profile');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when currentPassword is missing', async () => {
            const response = await api
                .patch('/api/v1/profile/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ newPassword: 'NewPassword456!' });

            expectValidationErrorResponse(response);
        });

        it('returns 400 when newPassword is shorter than 8 characters', async () => {
            const response = await api
                .patch('/api/v1/profile/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: PASSWORD,
                    newPassword: 'short',
                });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication fails (401)
    // -------------------------------------------------------------------------

    describe('when current password is wrong or auth header is missing', () => {

        it('returns 401 when currentPassword is incorrect', async () => {
            const response = await api
                .patch('/api/v1/profile/password')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    currentPassword: 'WrongPassword!',
                    newPassword: 'NewPassword456!',
                });

            expectUnauthorizedResponse(response, /current password is incorrect/i);
        });

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api
                .patch('/api/v1/profile/password')
                .send({
                    currentPassword: PASSWORD,
                    newPassword: 'NewPassword456!',
                });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });
    });
});
