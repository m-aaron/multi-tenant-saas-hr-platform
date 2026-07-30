import { afterAll, describe, expect, it } from 'vitest';

import { api } from '#helpers/test-request.helper.js';
import { testPool } from '#tests/setup.js';
import {
    cleanupOrg,
    getLatestAuditLog,
    getUserId,
} from '#helpers/test-database.helper.js';
import {
    expectConflictResponse,
    expectNullDataSuccessResponse,
    expectValidationErrorResponse,
} from '#helpers/test-response.helper.js';


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

    afterAll(async () => {
        await cleanupOrg(ORG_SLUG);
        // Also clean up the org created by the duplicate-name conflict test
        await cleanupOrg(`${ORG_SLUG}-different-slug`);
    });


    // -------------------------------------------------------------------------
    // Happy path
    // -------------------------------------------------------------------------

    describe('when a valid payload is submitted', () => {

        // orgId is captured in the first test and shared across the group.
        // These tests intentionally form an ordered scenario: register → verify DB state.
        let orgId: string;

        it('returns 201 with the expected response body', async () => {
            const response = await api
                .post('/api/v1/auth/register')
                .send(VALID_PAYLOAD);

            expectNullDataSuccessResponse(response, 201);
        });

        it('persists an organization row with the correct name and slug', async () => {
            const result = await testPool.query<{ id: string; name: string; slug: string }>(
                'SELECT id, name, slug FROM organizations WHERE slug = $1',
                [ORG_SLUG],
            );

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]!.name).toBe(ORG_NAME);
            expect(result.rows[0]!.slug).toBe(ORG_SLUG);

            // Capture for subsequent DB checks in this describe block
            orgId = result.rows[0]!.id;
        });

        it('seeds default roles for the organization', async () => {
            const result = await testPool.query<{ count: string }>(
                'SELECT COUNT(*) AS count FROM roles WHERE organization_id = $1',
                [orgId],
            );

            expect(Number(result.rows[0]!.count)).toBeGreaterThan(0);
        });

        it('creates an owner employee row', async () => {
            const result = await testPool.query<{ first_name: string; last_name: string }>(
                'SELECT first_name, last_name FROM employees WHERE organization_id = $1',
                [orgId],
            );

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]!.first_name).toBe(VALID_PAYLOAD.firstName);
            expect(result.rows[0]!.last_name).toBe(VALID_PAYLOAD.lastName);
        });

        it('creates an owner user row with status active', async () => {
            const result = await testPool.query<{ email: string; status: string }>(
                'SELECT email, status FROM users WHERE organization_id = $1',
                [orgId],
            );

            expect(result.rows).toHaveLength(1);
            expect(result.rows[0]!.email).toBe(OWNER_EMAIL.toLowerCase());
            expect(result.rows[0]!.status).toBe('active');
        });

        it('creates a profile row for the owner user', async () => {
            const userId = await getUserId(orgId);

            const profileResult = await testPool.query<{ user_id: string }>(
                'SELECT user_id FROM profiles WHERE user_id = $1',
                [userId],
            );

            expect(profileResult.rows).toHaveLength(1);
            expect(profileResult.rows[0]!.user_id).toBe(userId);
        });

        it('writes audit log entries for the registration', async () => {
            const result = await testPool.query<{ action: string; entity: string }>(
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

            const entries = result.rows;

            // Expect entries for: org registered, employee created, user created, profile created
            expect(entries.length).toBeGreaterThanOrEqual(4);

            const actions = entries.map((r) => `${r.action}:${r.entity}`);
            expect(actions).toContain('registered:organization');
            expect(actions).toContain('created:employee');
            expect(actions).toContain('created:user');
            expect(actions).toContain('created:profile');
        });

        it('writes a registered:organization audit log entry', async () => {
            const log = await getLatestAuditLog(orgId, 'registered');
            expect(log).toBeDefined();
            expect(log!.entity).toBe('organization');
            // actor_id is null at registration time — no user exists yet
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
