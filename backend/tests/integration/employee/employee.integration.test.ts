import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#tests/helpers/test-request.helper.js';
import { testPool } from '#tests/setup.js';
import {
    cleanupOrg,
    getLatestActivityLog,
    getLatestAuditLog,
    getOrgId,
    getUserId,
    setUserRole
} from '#tests/helpers/test-database.helper.js';
import {
    expectErrorResponse,
    expectForbiddenResponse,
    expectNullDataSuccessResponse,
    expectSuccessResponse,
    expectUnauthorizedResponse,
    expectValidationErrorResponse,
} from '#tests/helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-emp-${TEST_ID}`;
const ORG_NAME = `Test Employee Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-emp-${TEST_ID}@example.com`;
const PASSWORD = 'Password123';

const REGISTER_PAYLOAD = {
    name: ORG_NAME,
    slug: ORG_SLUG,
    ownerEmail: OWNER_EMAIL,
    password: PASSWORD,
    firstName: 'Jane',
    lastName: 'Doe',
};

const VALID_CREATE_PAYLOAD = {
    firstName: 'Alex',
    lastName: 'Morgan',
    jobTitle: 'Software Engineer',
    employmentStatus: 'regular',
    hireDate: '2025-01-15',
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


async function createEmployee(override?: Record<string, unknown>): Promise<string> {
    const response = await api
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
            ...VALID_CREATE_PAYLOAD,
            ...override,
        });

    expectSuccessResponse(response, 201);
    return response.body.data.id as string;
}

async function createDepartment(name?: string): Promise<string> {
    const deptName = name ?? `Dept ${crypto.randomUUID()}`;
    const response = await api
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: deptName });

    expectSuccessResponse(response, 201);
    return response.body.data.id as string;
}


// ---------------------------------------------------------------------------
// Tests: POST /api/v1/employees
// ---------------------------------------------------------------------------

describe('POST /api/v1/employees', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('creates an employee and records persistence, employee number generation, activity, and audit side effects', async () => {
            const departmentId = await createDepartment();

            const payload = {
                ...VALID_CREATE_PAYLOAD,
                middleName: 'James',
                nameExtension: 'Jr.',
                departmentId,
            };

            const response = await api
                .post('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(payload);

            expectSuccessResponse(response, 201);
            const employeeData = response.body.data;

            expect(employeeData.firstName).toBe(payload.firstName);
            expect(employeeData.lastName).toBe(payload.lastName);
            expect(employeeData.jobTitle).toBe(payload.jobTitle);
            expect(employeeData.employmentStatus).toBe(payload.employmentStatus);
            expect(employeeData.departmentId).toBe(departmentId);
            expect(employeeData.employeeNumber).toBeDefined();
            expect(typeof employeeData.employeeNumber).toBe('string');

            const employeeId = employeeData.id as string;

            const dbResult = await testPool.query<{
                first_name: string;
                last_name: string;
                employee_number: string;
                organization_id: string;
            }>(
                'SELECT first_name, last_name, employee_number, organization_id FROM employees WHERE id = $1 AND deleted_at IS NULL',
                [employeeId],
            );
            expect(dbResult.rows).toHaveLength(1);
            expect(dbResult.rows[0]!.first_name).toBe(payload.firstName);
            expect(dbResult.rows[0]!.last_name).toBe(payload.lastName);
            expect(dbResult.rows[0]!.organization_id).toBe(orgId);

            const activityLog = await getLatestActivityLog(orgId, 'employee.created');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'created');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('employee');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when required fields are missing', async () => {
            const response = await api
                .post('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({});

            expectValidationErrorResponse(response);
        });

        it('returns 400 when hireDate is in the future', async () => {
            const response = await api
                .post('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    ...VALID_CREATE_PAYLOAD,
                    hireDate: '2099-01-01',
                });

            expectValidationErrorResponse(response);
        });

        it('returns 400 when employmentStatus is invalid', async () => {
            const response = await api
                .post('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    ...VALID_CREATE_PAYLOAD,
                    employmentStatus: 'super_permanent',
                });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when referenced entities are not found (404)', () => {

        it('returns 404 when departmentId does not exist', async () => {
            const response = await api
                .post('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    ...VALID_CREATE_PAYLOAD,
                    departmentId: crypto.randomUUID(),
                });

            expectErrorResponse(response, 404, /department not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api
                .post('/api/v1/employees')
                .send(VALID_CREATE_PAYLOAD);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .post('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`)
                .send(VALID_CREATE_PAYLOAD);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/employees
// ---------------------------------------------------------------------------

describe('GET /api/v1/employees', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when authenticated with allowed roles', () => {

        it('returns 200 with active employees for the organization', async () => {
            const employeeId = await createEmployee();

            const response = await api
                .get('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);

            const ids = response.body.data.map((e: { id: string }) => e.id);
            expect(ids).toContain(employeeId);
        });

        it('returns 200 for hr_manager role', async () => {
            await setUserRole(orgId, userId, 'hr_manager');

            const response = await api
                .get('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const response = await api.get('/api/v1/employees');

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: GET /api/v1/employees/:employeeId
// ---------------------------------------------------------------------------

describe('GET /api/v1/employees/:employeeId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when the employee exists', () => {

        it('returns 200 with employee details', async () => {
            const employeeId = await createEmployee({ jobTitle: 'Lead Architect' });

            const response = await api
                .get(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(response, 200);
            expect(response.body.data.id).toBe(employeeId);
            expect(response.body.data.jobTitle).toBe('Lead Architect');
            expect(response.body.data.organizationId).toBe(orgId);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when the employee does not exist', () => {

        it('returns 404 for an unknown employee ID', async () => {
            const response = await api
                .get(`/api/v1/employees/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectErrorResponse(response, 404, /employee not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const employeeId = await createEmployee();

            const response = await api.get(`/api/v1/employees/${employeeId}`);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            const employeeId = await createEmployee();
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .get(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: PATCH /api/v1/employees/:employeeId
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/employees/:employeeId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is supplied', () => {

        it('updates an employee and records persistence, activity, and audit side effects', async () => {
            const employeeId = await createEmployee();
            const newJobTitle = `Principal Engineer ${crypto.randomUUID()}`;

            const response = await api
                .patch(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ jobTitle: newJobTitle });

            expectSuccessResponse(response, 200);
            expect(response.body.data.jobTitle).toBe(newJobTitle);

            const dbResult = await testPool.query<{ job_title: string }>(
                'SELECT job_title FROM employees WHERE id = $1',
                [employeeId],
            );
            expect(dbResult.rows[0]!.job_title).toBe(newJobTitle);

            const activityLog = await getLatestActivityLog(orgId, 'employee.updated');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            const auditLog = await getLatestAuditLog(orgId, 'updated');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('employee');
        });
    });


    // -------------------------------------------------------------------------
    // Validation fails (400)
    // -------------------------------------------------------------------------

    describe('when validation fails (400)', () => {

        it('returns 400 when hireDate is in the future', async () => {
            const employeeId = await createEmployee();

            const response = await api
                .patch(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ hireDate: '2099-12-31' });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when employee or department does not exist', () => {

        it('returns 404 for an unknown employee ID', async () => {
            const response = await api
                .patch(`/api/v1/employees/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ jobTitle: 'Valid New Title' });

            expectErrorResponse(response, 404, /employee not found/i);
        });

        it('returns 404 when updating to a non-existent departmentId', async () => {
            const employeeId = await createEmployee();

            const response = await api
                .patch(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ departmentId: crypto.randomUUID() });

            expectErrorResponse(response, 404, /department not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const employeeId = await createEmployee();

            const response = await api
                .patch(`/api/v1/employees/${employeeId}`)
                .send({ jobTitle: 'Valid Job Title' });

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            const employeeId = await createEmployee();
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .patch(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ jobTitle: 'Valid Job Title' });

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});


// ---------------------------------------------------------------------------
// Tests: DELETE /api/v1/employees/:employeeId
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/employees/:employeeId', () => {

    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when the employee exists', () => {

        it('archives an employee and records soft delete, list visibility, activity, and audit side effects', async () => {
            const employeeId = await createEmployee();

            const response = await api
                .delete(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectNullDataSuccessResponse(response, 200);

            // DB check: deleted_at is set
            const dbResult = await testPool.query<{ deleted_at: Date | null }>(
                'SELECT deleted_at FROM employees WHERE id = $1',
                [employeeId],
            );
            expect(dbResult.rows[0]!.deleted_at).not.toBeNull();

            // List visibility check: no longer in active employee list
            const listResponse = await api
                .get('/api/v1/employees')
                .set('Authorization', `Bearer ${accessToken}`);

            expectSuccessResponse(listResponse, 200);
            const ids = listResponse.body.data.map((e: { id: string }) => e.id);
            expect(ids).not.toContain(employeeId);

            // Activity log check
            const activityLog = await getLatestActivityLog(orgId, 'employee.archived');
            expect(activityLog).toBeDefined();
            expect(activityLog!.actor_id).toBe(userId);

            // Audit log check
            const auditLog = await getLatestAuditLog(orgId, 'archived');
            expect(auditLog).toBeDefined();
            expect(auditLog!.actor_id).toBe(userId);
            expect(auditLog!.entity).toBe('employee');
        });
    });


    // -------------------------------------------------------------------------
    // Not found fails (404)
    // -------------------------------------------------------------------------

    describe('when the employee does not exist', () => {

        it('returns 404 for an unknown employee ID', async () => {
            const response = await api
                .delete(`/api/v1/employees/${crypto.randomUUID()}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectErrorResponse(response, 404, /employee not found/i);
        });
    });


    // -------------------------------------------------------------------------
    // Authentication or authorization fails (401, 403)
    // -------------------------------------------------------------------------

    describe('when authentication or authorization fails', () => {

        it('returns 401 when Authorization header is missing', async () => {
            const employeeId = await createEmployee();

            const response = await api.delete(`/api/v1/employees/${employeeId}`);

            expectUnauthorizedResponse(response, /authorization header is missing/i);
        });

        it('returns 403 when user has forbidden role (employee)', async () => {
            const employeeId = await createEmployee();
            await setUserRole(orgId, userId, 'employee');

            const response = await api
                .delete(`/api/v1/employees/${employeeId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expectForbiddenResponse(response, /you do not have permission to perform this action/i);
        });
    });
});
