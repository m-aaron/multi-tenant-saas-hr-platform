import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { api } from '#tests/helpers/test-request.helper.js';
import { testPool } from '#tests/setup.js';
import {
    cleanupOrg,
    getLatestAuditLog,
    getUserId,
} from '#tests/helpers/test-database.helper.js';
import {
    expectConflictResponse,
    expectNullDataSuccessResponse,
    expectValidationErrorResponse,
} from '#tests/helpers/test-response.helper.js';


// ---------------------------------------------------------------------------
// Shared test fixture
// ---------------------------------------------------------------------------

const TEST_ID = crypto.randomUUID();
const ORG_SLUG = `test-register-${TEST_ID}`;
const ORG_NAME = `Test Register Org ${TEST_ID}`;
const OWNER_EMAIL = `owner-${TEST_ID}@example.com`;
const PASSWORD = 'Password123';

const VALID_PAYLOAD = {
    name: ORG_NAME,
    slug: ORG_SLUG,
    ownerEmail: OWNER_EMAIL,
    password: PASSWORD,
    firstName: 'John',
    lastName: 'Doe',
};


// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/v1/auth/register', () => {

    beforeEach(async () => {
        await cleanupOrg(ORG_SLUG);
        await cleanupOrg(`${ORG_SLUG}-different-slug`);
    });

    afterEach(async () => {
        await cleanupOrg(ORG_SLUG);
        await cleanupOrg(`${ORG_SLUG}-different-slug`);
    });


    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is submitted', () => {

        it('registers a new organization and verifies organization, default roles, employee, user, profile, and audit log side effects', async () => {
            const response = await api
                .post('/api/v1/auth/register')
                .send(VALID_PAYLOAD);

            expectNullDataSuccessResponse(response, 201);

            const orgResult = await testPool.query<{ id: string; name: string; slug: string }>(
                'SELECT id, name, slug FROM organizations WHERE slug = $1',
                [ORG_SLUG],
            );

            expect(orgResult.rows).toHaveLength(1);
            expect(orgResult.rows[0]!.name).toBe(ORG_NAME);
            expect(orgResult.rows[0]!.slug).toBe(ORG_SLUG);

            const orgId = orgResult.rows[0]!.id;

            const rolesResult = await testPool.query<{ count: string }>(
                'SELECT COUNT(*) AS count FROM roles WHERE organization_id = $1',
                [orgId],
            );
            expect(Number(rolesResult.rows[0]!.count)).toBeGreaterThan(0);

            const empResult = await testPool.query<{ first_name: string; last_name: string }>(
                'SELECT first_name, last_name FROM employees WHERE organization_id = $1',
                [orgId],
            );
            expect(empResult.rows).toHaveLength(1);
            expect(empResult.rows[0]!.first_name).toBe(VALID_PAYLOAD.firstName);
            expect(empResult.rows[0]!.last_name).toBe(VALID_PAYLOAD.lastName);

            const userResult = await testPool.query<{ email: string; status: string }>(
                'SELECT email, status FROM users WHERE organization_id = $1',
                [orgId],
            );
            expect(userResult.rows).toHaveLength(1);
            expect(userResult.rows[0]!.email).toBe(OWNER_EMAIL.toLowerCase());
            expect(userResult.rows[0]!.status).toBe('active');

            const userId = await getUserId(orgId);
            const profileResult = await testPool.query<{ user_id: string }>(
                'SELECT user_id FROM profiles WHERE user_id = $1',
                [userId],
            );
            expect(profileResult.rows).toHaveLength(1);
            expect(profileResult.rows[0]!.user_id).toBe(userId);

            const auditLogsResult = await testPool.query<{ action: string; entity: string }>(
                `
                SELECT 
                    action,
                    entity
                FROM audit_logs
                WHERE organization_id = $1
                ORDER BY created_at ASC
                `,
                [orgId],
            );

            const entries = auditLogsResult.rows;
            expect(entries.length).toBeGreaterThanOrEqual(4);

            const actions = entries.map((r) => `${r.action}:${r.entity}`);
            expect(actions).toContain('registered:organization');
            expect(actions).toContain('created:employee');
            expect(actions).toContain('created:user');
            expect(actions).toContain('created:profile');

            const regAuditLog = await getLatestAuditLog(orgId, 'registered');
            expect(regAuditLog).toBeDefined();
            expect(regAuditLog!.entity).toBe('organization');
        });
    });


    // -------------------------------------------------------------------------
    // Validation errors — 400
    // -------------------------------------------------------------------------

    describe('when required fields are missing', () => {

        it('returns 400 when name is missing', async () => {
            const { name: _name, ...payload } = VALID_PAYLOAD;

            const response = await api
                .post('/api/v1/auth/register')
                .send(payload);

            expectValidationErrorResponse(response);
        });

        it('returns 400 when ownerEmail is missing', async () => {
            const { ownerEmail: _email, ...payload } = VALID_PAYLOAD;

            const response = await api
                .post('/api/v1/auth/register')
                .send(payload);

            expectValidationErrorResponse(response);
        });

        it('returns 400 when firstName is missing', async () => {
            const { firstName: _firstName, ...payload } = VALID_PAYLOAD;

            const response = await api
                .post('/api/v1/auth/register')
                .send(payload);

            expectValidationErrorResponse(response);
        });

        it('returns 400 when lastName is missing', async () => {
            const { lastName: _lastName, ...payload } = VALID_PAYLOAD;

            const response = await api
                .post('/api/v1/auth/register')
                .send(payload);

            expectValidationErrorResponse(response);
        });
    });

    describe('when field values are invalid', () => {

        it('returns 400 when ownerEmail is not a valid email address', async () => {
            const response = await api
                .post('/api/v1/auth/register')
                .send({ ...VALID_PAYLOAD, slug: `${ORG_SLUG}-bad-email`, ownerEmail: 'not-an-email' });

            expectValidationErrorResponse(response);
        });

        it('returns 400 when password is shorter than 8 characters', async () => {
            const response = await api
                .post('/api/v1/auth/register')
                .send({ ...VALID_PAYLOAD, slug: `${ORG_SLUG}-bad-pw`, password: 'short' });

            expectValidationErrorResponse(response);
        });

        it('returns 400 when slug contains underscores', async () => {
            // The schema lowercases before regex validation, so uppercase alone is
            // silently normalized. Underscores are genuinely disallowed by the regex
            // (/^[a-z0-9-]+$/) even after lowercasing.
            const response = await api
                .post('/api/v1/auth/register')
                .send({ ...VALID_PAYLOAD, slug: 'invalid_slug' });

            expectValidationErrorResponse(response);
        });

        it('returns 400 when slug contains spaces', async () => {
            const response = await api
                .post('/api/v1/auth/register')
                .send({ ...VALID_PAYLOAD, slug: 'invalid slug' });

            expectValidationErrorResponse(response);
        });

        it('returns 400 when organization name is shorter than 3 characters', async () => {
            const response = await api
                .post('/api/v1/auth/register')
                .send({ ...VALID_PAYLOAD, slug: `${ORG_SLUG}-bad-name`, name: 'AB' });

            expectValidationErrorResponse(response);
        });
    });


    // -------------------------------------------------------------------------
    // Conflict errors — 409
    // -------------------------------------------------------------------------

    describe('when the organization already exists', () => {

        it('returns 409 when the organization name is already taken', async () => {
            await api.post('/api/v1/auth/register').send(VALID_PAYLOAD);

            // Register with the same name but a different slug
            const response = await api
                .post('/api/v1/auth/register')
                .send({
                    ...VALID_PAYLOAD,
                    slug: `${ORG_SLUG}-different-slug`,
                    ownerEmail: `other-${crypto.randomUUID()}@example.com`,
                });

            expectConflictResponse(response, /organization name already exists/i);
        });

        it('returns 409 when the organization slug is already taken', async () => {
            await api.post('/api/v1/auth/register').send(VALID_PAYLOAD);

            // Register with the same slug but a different name
            const response = await api
                .post('/api/v1/auth/register')
                .send({
                    ...VALID_PAYLOAD,
                    name: `Different Name ${crypto.randomUUID()}`,
                    ownerEmail: `another-${crypto.randomUUID()}@example.com`,
                });

            expectConflictResponse(response, /organization slug already exists/i);
        });
    });
});
