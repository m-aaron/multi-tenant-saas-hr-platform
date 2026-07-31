import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#helpers/test-request.helper.js';
import { testPool } from '#tests/setup.js';
import {
    cleanupOrg,
    getLatestActivityLog,
    getLatestAuditLog,
    getOrgId,
    getUserId,
} from '#helpers/test-database.helper.js';
import {
    expectConflictResponse,
    expectErrorResponse,
    expectForbiddenResponse,
    expectSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-user-${TEST_ID}`;
const ORG_NAME = `Test User Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-user-${TEST_ID}@example.com`;
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
// Helpers
// ---------------------------------------------------------------------------

async function setUserRole(
    roleName: 'owner' | 'administrator' | 'hr_manager' | 'employee',
): Promise<void> {
    const roleResult = await testPool.query<{ id: string }>(
        'SELECT id FROM roles WHERE organization_id = $1 AND name = $2',
        [orgId, roleName],
    );
    const roleId = roleResult.rows[0]!.id;
    await testPool.query(
        'UPDATE users SET role_id = $1 WHERE id = $2',
        [roleId, userId],
    );
}

async function getRoleId(
    roleName: 'owner' | 'administrator' | 'hr_manager' | 'employee',
): Promise<string> {
    const result = await testPool.query<{ id: string }>(
        'SELECT id FROM roles WHERE organization_id = $1 AND name = $2',
        [orgId, roleName],
    );
    return result.rows[0]!.id;
}

async function createEmployee(firstName = 'UserTest'): Promise<string> {
    const response = await api
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            firstName,
            lastName: 'Employee',
            jobTitle: 'Developer',
            employmentStatus: 'regular',
            hireDate: '2025-01-15',
        });

    expectSuccessResponse(response, 201);
    return response.body.data.id as string;
}

async function createTestUser(override?: Record<string, unknown>): Promise<{
    userId: string;
    email: string;
    employeeId: string;
    roleId: string;
}> {
    const employeeId = await createEmployee(`Emp-${crypto.randomUUID()}`);
    const roleId = await getRoleId('employee');
    const email = `created-user-${crypto.randomUUID()}@example.com`;

    const response = await api
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            employeeId,
            roleId,
            email,
            password: 'Password123',
            ...override,
        });

    expectSuccessResponse(response, 201);
    return {
        userId: response.body.data.id as string,
        email: response.body.data.email as string,
        employeeId,
        roleId,
    };
}


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/users
// ---------------------------------------------------------------------------

describe('GET /api/v1/users', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when authenticated with allowed roles', () => {

        it('returns 200 with active users for the organization', async () => {
            const response = await api
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);

            const ids = response.body.data.map((u: { id: string }) => u.id);
            expect(ids).toContain(userId);
        });

        it('returns 200 for hr_manager role', async () => {
            await setUserRole('hr_manager');

            const response = await api
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get('/api/v1/users');

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole('employee');

            const response = await api
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/users/:userId
// ---------------------------------------------------------------------------

describe('GET /api/v1/users/:userId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when the user exists', () => {

        it('returns 200 with user details', async () => {
            const response = await api
                .get(`/api/v1/users/${userId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data.id).toBe(userId);
            expect(response.body.data.email).toBe(OWNER_EMAIL.toLowerCase());
            expect(response.body.data.organizationId).toBe(orgId);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when the user does not exist', () => {

        it('returns 404 for an unknown user ID', async () => {
            const response = await api
                .get(`/api/v1/users/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectErrorResponse(response, 404, /user not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get(`/api/v1/users/${userId}`);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole('employee');

            const response = await api
                .get(`/api/v1/users/${userId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: POST /api/v1/users
// ---------------------------------------------------------------------------

describe('POST /api/v1/users', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('creates a user and records persistence, profile initialization, activity, and audit side effects', async () => {
            const employeeId = await createEmployee('CreateUserEmp');
            const roleId = await getRoleId('employee');
            const email = `newuser-${crypto.randomUUID()}@example.com`;
            const password = 'Password123';

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId,
                    email,
                    password,
                });

            expectSuccessResponse(response, 201);
            expect(response.body.data.email).toBe(email.toLowerCase());
            expect(response.body.data.status).toBe('active');
            expect(response.body.data.roleId).toBe(roleId);

            const createdUserId = response.body.data.id as string;

            const userDbResult = await testPool.query<{
                email: string;
                status: string;
                role_id: string;
                organization_id: string;
            }>(
                'SELECT email, status, role_id, organization_id FROM users WHERE id = $1',
                [createdUserId],
            )
            expect(userDbResult.rows).toHaveLength(1);
            expect(userDbResult.rows[0]!.email).toBe(email.toLowerCase());
            expect(userDbResult.rows[0]!.status).toBe('active');
            expect(userDbResult.rows[0]!.role_id).toBe(roleId);
            expect(userDbResult.rows[0]!.organization_id).toBe(orgId);

            const profileDbResult = await testPool.query<{ user_id: string }>(
                'SELECT user_id FROM profiles WHERE user_id = $1',
                [createdUserId],
            );
            expect(profileDbResult.rows).toHaveLength(1);
            expect(profileDbResult.rows[0]!.user_id).toBe(createdUserId);

            const activityLog = await getLatestActivityLog(orgId, 'user.created');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'created');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('user');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when required fields are missing', async () => {
            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expectValidationErrorResponse(response);
        });

        it('returns 400 when email format is invalid', async () => {
            const employeeId = await createEmployee();
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId,
                    email: 'not-an-email',
                    password: 'Password123',
                });

            expectValidationErrorResponse(response);
        });

        it('returns 400 when password is shorter than 8 characters', async () => {
            const employeeId = await createEmployee();
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId,
                    email: `valid-${crypto.randomUUID()}@example.com`,
                    password: 'short',
                });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when referenced entities are not found (404)', () => {

        it('returns 404 when employeeId does not exist', async () => {
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId: crypto.randomUUID(),
                    roleId,
                    email: `noemp-${crypto.randomUUID()}@example.com`,
                    password: 'Password123',
                });

            expectErrorResponse(response, 404, /employee not found/i);
        });

        it('returns 404 when roleId does not exist', async () => {
            const employeeId = await createEmployee();

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId: crypto.randomUUID(),
                    email: `norole-${crypto.randomUUID()}@example.com`,
                    password: 'Password123',
                });

            expectErrorResponse(response, 404, /role not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Conflict fails (409)
    // -------------------------------------------------------------------------

    describe('when conflicts occur (409)', () => {

        it('returns 409 when employee already has a user account', async () => {
            // Get employee ID of the owner user created during registration
            const ownerEmpResult = await testPool.query<{ employee_id: string }>(
                'SELECT employee_id FROM users WHERE id = $1',
                [userId],
            );
            const ownerEmployeeId = ownerEmpResult.rows[0]!.employee_id;
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId: ownerEmployeeId,
                    roleId,
                    email: `dupeemp-${crypto.randomUUID()}@example.com`,
                    password: 'Password123',
                });

            expectConflictResponse(response, /employee already has a user account/i);
        });

        it('returns 409 when email already exists in organization', async () => {
            const employeeId = await createEmployee('DupeEmailEmp');
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId,
                    email: OWNER_EMAIL,
                    password: 'Password123',
                });

            expectConflictResponse(response, /user with this email already exists/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api
                .post('/api/v1/users')
                .send({
                    employeeId: crypto.randomUUID(),
                    roleId: crypto.randomUUID(),
                    email: 'authfail@example.com',
                    password: 'Password123',
                });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (hr_manager)', async () => {
            await setUserRole('hr_manager');

            const response = await api
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId: crypto.randomUUID(),
                    roleId: crypto.randomUUID(),
                    email: 'hrfail@example.com',
                    password: 'Password123',
                });

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: POST /api/v1/users/invite
// ---------------------------------------------------------------------------

describe('POST /api/v1/users/invite', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('invites a user and records persistence with status invited, profile initialization, activity, and audit side effects', async () => {
            const employeeId = await createEmployee('InviteEmp');
            const roleId = await getRoleId('employee');
            const email = `invited-${crypto.randomUUID()}@example.com`;

            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId,
                    email,
                });

            expectSuccessResponse(response, 201);
            expect(response.body.data.email).toBe(email.toLowerCase());
            expect(response.body.data.status).toBe('invited');
            expect(response.body.data.roleId).toBe(roleId);

            const invitedUserId = response.body.data.id as string;

            // 1. Verify DB user persistence
            const userDbResult = await testPool.query<{
                email: string;
                status: string;
                password_hash: string | null;
            }>(
                'SELECT email, status, password_hash FROM users WHERE id = $1',
                [invitedUserId],
            );
            expect(userDbResult.rows).toHaveLength(1);
            expect(userDbResult.rows[0]!.email).toBe(email.toLowerCase());
            expect(userDbResult.rows[0]!.status).toBe('invited');
            expect(userDbResult.rows[0]!.password_hash).toBeNull();

            // 2. Verify DB profile auto-creation
            const profileDbResult = await testPool.query<{ user_id: string }>(
                'SELECT user_id FROM profiles WHERE user_id = $1',
                [invitedUserId],
            );
            expect(profileDbResult.rows).toHaveLength(1);

            // 3. Verify activity log
            const activityLog = await getLatestActivityLog(orgId, 'user.invited');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            // 4. Verify audit log
            const auditLog = await getLatestAuditLog(orgId, 'invited');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('user');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when required fields are missing', async () => {
            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expectValidationErrorResponse(response);
        });

        it('returns 400 when email format is invalid', async () => {
            const employeeId = await createEmployee();
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId,
                    email: 'invalid-email',
                });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when referenced entities are not found (404)', () => {

        it('returns 404 when employeeId does not exist', async () => {
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId: crypto.randomUUID(),
                    roleId,
                    email: `invite-noemp-${crypto.randomUUID()}@example.com`,
                });

            expectErrorResponse(response, 404, /employee not found/i);
        });

        it('returns 404 when roleId does not exist', async () => {
            const employeeId = await createEmployee();

            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId: crypto.randomUUID(),
                    email: `invite-norole-${crypto.randomUUID()}@example.com`,
                });

            expectErrorResponse(response, 404, /role not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Conflict fails (409)
    // -------------------------------------------------------------------------

    describe('when conflicts occur (409)', () => {

        it('returns 409 when employee already has a user account', async () => {
            const ownerEmpResult = await testPool.query<{ employee_id: string }>(
                'SELECT employee_id FROM users WHERE id = $1',
                [userId],
            );
            const ownerEmployeeId = ownerEmpResult.rows[0]!.employee_id;
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId: ownerEmployeeId,
                    roleId,
                    email: `invite-dupe-${crypto.randomUUID()}@example.com`,
                });

            expectConflictResponse(response, /employee already has a user account/i);
        });

        it('returns 409 when email already exists in organization', async () => {
            const employeeId = await createEmployee('InviteDupeEmail');
            const roleId = await getRoleId('employee');

            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId,
                    roleId,
                    email: OWNER_EMAIL,
                });

            expectConflictResponse(response, /user with this email already exists/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api
                .post('/api/v1/users/invite')
                .send({
                    employeeId: crypto.randomUUID(),
                    roleId: crypto.randomUUID(),
                    email: 'inviteauthfail@example.com',
                });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (hr_manager)', async () => {
            await setUserRole('hr_manager');

            const response = await api
                .post('/api/v1/users/invite')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId: crypto.randomUUID(),
                    roleId: crypto.randomUUID(),
                    email: 'invitehrfail@example.com',
                });

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: PATCH /api/v1/users/:userId
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/users/:userId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('updates a user and records persistence, activity, and audit side effects', async () => {
            const targetUser = await createTestUser();

            const response = await api
                .patch(`/api/v1/users/${targetUser.userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'inactive' });

            expectSuccessResponse(response, 200);
            expect(response.body.data.status).toBe('inactive');

            const dbResult = await testPool.query<{ status: string }>(
                'SELECT status FROM users WHERE id = $1',
                [targetUser.userId],
            );
            expect(dbResult.rows[0]!.status).toBe('inactive');

            const activityLog = await getLatestActivityLog(orgId, 'user.updated');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'updated');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('user');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when status is invalid', async () => {
            const targetUser = await createTestUser();

            const response = await api
                .patch(`/api/v1/users/${targetUser.userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'invalid_status_value' });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when user or role does not exist', () => {

        it('returns 404 for an unknown user ID', async () => {
            const response = await api
                .patch(`/api/v1/users/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'inactive' });

            expectErrorResponse(response, 404, /user not found/i);
        });

        it('returns 404 when roleId does not exist', async () => {
            const targetUser = await createTestUser();

            const response = await api
                .patch(`/api/v1/users/${targetUser.userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ roleId: crypto.randomUUID() });

            expectErrorResponse(response, 404, /role not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Conflict fails (409)
    // -------------------------------------------------------------------------

    describe('when email conflicts (409)', () => {

        it('returns 409 when updating email to an existing user email', async () => {
            const targetUser = await createTestUser();

            const response = await api
                .patch(`/api/v1/users/${targetUser.userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ email: OWNER_EMAIL });

            expectConflictResponse(response, /user with this email already exists/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const targetUser = await createTestUser();

            const response = await api
                .patch(`/api/v1/users/${targetUser.userId}`)
                .send({ status: 'inactive' });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (hr_manager)', async () => {
            const targetUser = await createTestUser();
            await setUserRole('hr_manager');

            const response = await api
                .patch(`/api/v1/users/${targetUser.userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'inactive' });

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: PATCH /api/v1/users/:userId/activate
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/users/:userId/activate', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when the user is inactive', () => {

        it('activates a user and records status change, activity, and audit side effects', async () => {
            const targetUser = await createTestUser();

            // Deactivate first
            await api
                .patch(`/api/v1/users/${targetUser.userId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ status: 'inactive' });

            // Activate
            const response = await api
                .patch(`/api/v1/users/${targetUser.userId}/activate`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data.status).toBe('active');

            const dbResult = await testPool.query<{ status: string }>(
                'SELECT status FROM users WHERE id = $1',
                [targetUser.userId],
            );
            expect(dbResult.rows[0]!.status).toBe('active');

            const activityLog = await getLatestActivityLog(orgId, 'user.reactivated');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'reactivated');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('user');
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when the user does not exist', () => {

        it('returns 404 for an unknown user ID', async () => {
            const response = await api
                .patch(`/api/v1/users/${crypto.randomUUID()}/activate`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectErrorResponse(response, 404, /user not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Conflict fails (409)
    // -------------------------------------------------------------------------

    describe('when the user is already active', () => {

        it('returns 409 when user account is already active', async () => {
            const response = await api
                .patch(`/api/v1/users/${userId}/activate`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectConflictResponse(response, /user account is already active/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.patch(`/api/v1/users/${userId}/activate`);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (hr_manager)', async () => {
            await setUserRole('hr_manager');

            const response = await api
                .patch(`/api/v1/users/${userId}/activate`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});
