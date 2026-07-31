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
    expectConflictResponse,
    expectErrorResponse,
    expectForbiddenResponse,
    expectSuccessResponse,
    expectNullDataSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-dept-${TEST_ID}`;
const ORG_NAME = `Test Department Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-dept-${TEST_ID}@example.com`;
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


async function createDepartment(name: string): Promise<string> {
    const response = await api
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name });

    expectSuccessResponse(response, 201);
    return response.body.data.id as string;
}


// ---------------------------------------------------------------------------
// Tests: POST /api/v1/departments
// ---------------------------------------------------------------------------

describe('POST /api/v1/departments', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('creates a department and records persistence, activity, and audit side effects', async () => {
            const name = `Engineering ${crypto.randomUUID()}`;

            const response = await api
                .post('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name });

            expectSuccessResponse(response, 201);
            expect(response.body.data.name).toBe(name);
            expect(response.body.data.organizationId).toBe(orgId);

            const departmentId = response.body.data.id as string;

            const dbResult = await testPool.query<{ name: string }>(
                'SELECT name FROM departments WHERE id = $1 AND deleted_at IS NULL',
                [departmentId],
            );
            expect(dbResult.rows[0]!.name).toBe(name);

            const activityLog = await getLatestActivityLog(orgId, 'department.created');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'created');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('department');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when name field is missing', async () => {
            const response = await api
                .post('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expectValidationErrorResponse(response);
        });

        it('returns 400 when name is shorter than 3 characters', async () => {
            const response = await api
                .post('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'AB' });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Conflict fails (409)
    // -------------------------------------------------------------------------

    describe('when the department name already exists (409)', () => {

        it('returns 409 when creating a department with a duplicate name', async () => {
            const name = `Duplicate Dept ${crypto.randomUUID()}`;
            await createDepartment(name);

            const response = await api
                .post('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name });

            expectConflictResponse(
                response,
                /department name already exists in this organization/i,
            );
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api
                .post('/api/v1/departments')
                .send({ name: 'Valid Department Name' });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .post('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Valid Department Name' });

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/departments
// ---------------------------------------------------------------------------

describe('GET /api/v1/departments', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when authenticated with allowed roles', () => {

        it('returns 200 with an empty list when no departments exist', async () => {
            const response = await api
                .get('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data).toEqual([]);
        });

        it('returns 200 with all active departments for the organization', async () => {
            const nameA = `Dept A ${crypto.randomUUID()}`;
            const nameB = `Dept B ${crypto.randomUUID()}`;
            await createDepartment(nameA);
            await createDepartment(nameB);

            const response = await api
                .get('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data).toHaveLength(2);
            const names = response.body.data.map((d: { name: string }) => d.name);
            expect(names).toContain(nameA);
            expect(names).toContain(nameB);
        });

        it('returns 200 for hr_manager role', async () => {
            await setUserRole(orgId, userId, 'hr_manager');

            const response = await api
                .get('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get('/api/v1/departments');

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/departments/:departmentId
// ---------------------------------------------------------------------------

describe('GET /api/v1/departments/:departmentId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when the department exists', () => {

        it('returns 200 with department details', async () => {
            const name = `Support ${crypto.randomUUID()}`;
            const departmentId = await createDepartment(name);

            const response = await api
                .get(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data.id).toBe(departmentId);
            expect(response.body.data.name).toBe(name);
            expect(response.body.data.organizationId).toBe(orgId);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when the department does not exist', () => {

        it('returns 404 for an unknown department ID', async () => {
            const response = await api
                .get(`/api/v1/departments/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectErrorResponse(response, 404, /department not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const departmentId = await createDepartment(`Auth Test ${crypto.randomUUID()}`);

            const response = await api.get(`/api/v1/departments/${departmentId}`);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            const departmentId = await createDepartment(`Forbidden Get ${crypto.randomUUID()}`);
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: PATCH /api/v1/departments/:departmentId
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/departments/:departmentId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('updates a department and records persistence, activity, and audit side effects', async () => {
            const departmentId = await createDepartment(`Original ${crypto.randomUUID()}`);
            const newName = `Renamed ${crypto.randomUUID()}`;

            const response = await api
                .patch(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: newName });

            expectSuccessResponse(response, 200);
            expect(response.body.data.name).toBe(newName);

            const dbResult = await testPool.query<{ name: string }>(
                'SELECT name FROM departments WHERE id = $1',
                [departmentId],
            );
            expect(dbResult.rows[0]!.name).toBe(newName);

            const activityLog = await getLatestActivityLog(orgId, 'department.updated');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'updated');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('department');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when name field is missing', async () => {
            const departmentId = await createDepartment(`Patch Valid ${crypto.randomUUID()}`);

            const response = await api
                .patch(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404, 409)
    // -------------------------------------------------------------------------

    describe('when the department does not exist or name conflicts', () => {

        it('returns 404 for an unknown department ID', async () => {
            const response = await api
                .patch(`/api/v1/departments/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Valid Department Name' });

            expectErrorResponse(response, 404, /department not found/i);
        });

        it('returns 409 when renaming to an existing department name', async () => {
            const existingName = `Existing ${crypto.randomUUID()}`;
            await createDepartment(existingName);
            const departmentId = await createDepartment(`Other ${crypto.randomUUID()}`);

            const response = await api
                .patch(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: existingName });

            expectConflictResponse(
                response,
                /department name already exists in this organization/i,
            );
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const departmentId = await createDepartment(`Patch Auth ${crypto.randomUUID()}`);

            const response = await api.patch(`/api/v1/departments/${departmentId}`);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has hr_manager role', async () => {
            const departmentId = await createDepartment(`Patch HR ${crypto.randomUUID()}`);
            await setUserRole(orgId, userId, 'hr_manager');

            const response = await api
                .patch(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ name: 'Valid Department Name' });

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: DELETE /api/v1/departments/:departmentId
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/departments/:departmentId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when the department exists', () => {

        it('archives a department and records soft delete, list visibility, activity, and audit side effects', async () => {
            const departmentId = await createDepartment(`To Delete ${crypto.randomUUID()}`);

            const response = await api
                .delete(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectNullDataSuccessResponse(response, 200);

            const dbResult = await testPool.query<{ deleted_at: Date | null }>(
                'SELECT deleted_at FROM departments WHERE id = $1',
                [departmentId],
            );
            expect(dbResult.rows[0]!.deleted_at).not.toBeNull();

            const listResponse = await api
                .get('/api/v1/departments')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(listResponse, 200);
            const ids = listResponse.body.data.map((d: { id: string }) => d.id);
            expect(ids).not.toContain(departmentId);

            const activityLog = await getLatestActivityLog(orgId, 'department.archived');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'archived');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('department');
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when the department does not exist', () => {

        it('returns 404 for an unknown department ID', async () => {
            const response = await api
                .delete(`/api/v1/departments/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectErrorResponse(response, 404, /department not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const departmentId = await createDepartment(`Delete Auth ${crypto.randomUUID()}`);
            
            const response = await api.delete(`/api/v1/departments/${departmentId}`);
            
            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has hr_manager role', async () => {
            const departmentId = await createDepartment(`Delete HR ${crypto.randomUUID()}`);
            await setUserRole(orgId, userId, 'hr_manager');

            const response = await api
                .delete(`/api/v1/departments/${departmentId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});
