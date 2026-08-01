import { beforeEach, describe, expect, it, vi } from 'vitest';

import { mockDb } from '#tests/mocks/database.mock.js';

// ---------------------------------------------------------------------------
// Module Mocks — hoisted by Vitest
// ---------------------------------------------------------------------------

vi.mock('#databases/index.js', () => ({ db: mockDb }));

vi.mock('#databases/transaction.js', () => ({
    withTransaction: vi.fn((cb: (client: unknown) => Promise<unknown>) => cb({})),
}));

vi.mock('#modules/organization/repositories/organization.repository.js', () => ({
    findOrganizationById: vi.fn(),
    updateOrganizationById: vi.fn(),
}));

vi.mock('#modules/activity/services/activity.service.js', () => ({
    ActivityLogService: {
        logOrganizationUpdated: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('#modules/audit/services/audit.service.js', () => ({
    AuditLogService: {
        logOrganizationUpdated: vi.fn().mockResolvedValue(undefined),
    },
}));

// ---------------------------------------------------------------------------
// SUT & Mocked Imports
// ---------------------------------------------------------------------------

import {
    getCurrentOrganization,
    updateCurrentOrganization,
} from '#modules/organization/services/organization.service.js';
import {
    findOrganizationById,
    updateOrganizationById,
} from '#modules/organization/repositories/organization.repository.js';
import { ActivityLogService } from '#modules/activity/services/activity.service.js';
import { AuditLogService } from '#modules/audit/services/audit.service.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';
import { ForbiddenError } from '#shared/errors/forbidden-error.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const MOCK_ORG_ROW = {
    id: 'org-123',
    name: 'Acme Corp',
    slug: 'acme-corp',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    revokedAt: null,
};

const MOCK_UPDATE_INPUT = {
    name: 'Acme Global Corp',
};

// ---------------------------------------------------------------------------
// Tests: getCurrentOrganization() & updateCurrentOrganization()
// ---------------------------------------------------------------------------

describe('getCurrentOrganization()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid active organization is requested', () => {
        it('returns organization details', async () => {
            vi.mocked(findOrganizationById).mockResolvedValueOnce(MOCK_ORG_ROW as never);

            const result = await getCurrentOrganization('org-123');

            expect(result).toEqual(MOCK_ORG_ROW);
            expect(findOrganizationById).toHaveBeenCalledWith(expect.anything(), 'org-123');
        });
    });

    describe('when organization is not found', () => {
        it('throws NotFoundError', async () => {
            vi.mocked(findOrganizationById).mockResolvedValueOnce(null);

            await expect(getCurrentOrganization('org-nonexistent')).rejects.toThrow(NotFoundError);
        });
    });

    describe('when organization account is inactive / revoked', () => {
        it('throws ForbiddenError', async () => {
            vi.mocked(findOrganizationById).mockResolvedValueOnce({
                ...MOCK_ORG_ROW,
                revokedAt: new Date('2026-02-01T00:00:00.000Z'),
            } as never);

            await expect(getCurrentOrganization('org-123')).rejects.toThrow(ForbiddenError);
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(findOrganizationById).mockRejectedValueOnce(new Error('Database error'));

            await expect(getCurrentOrganization('org-123')).rejects.toThrow('Database error');
        });
    });
});

describe('updateCurrentOrganization()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when valid active organization is updated', () => {
        it('updates organization, logs activity & audit events, and returns updated organization', async () => {
            const updatedOrg = {
                ...MOCK_ORG_ROW,
                name: 'Acme Global Corp',
                updatedAt: new Date('2026-02-01T00:00:00.000Z'),
            };

            vi.mocked(updateOrganizationById).mockResolvedValueOnce(updatedOrg as never);

            const result = await updateCurrentOrganization(
                MOCK_UPDATE_INPUT,
                'org-123',
                'user-123',
            );

            expect(result).toEqual(updatedOrg);
            expect(updateOrganizationById).toHaveBeenCalledWith(
                expect.anything(),
                'Acme Global Corp',
                'org-123',
            );

            expect(ActivityLogService.logOrganizationUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'user-123', client: expect.anything() },
                { name: 'Acme Global Corp' },
            );

            expect(AuditLogService.logOrganizationUpdated).toHaveBeenCalledWith(
                { organizationId: 'org-123', actorId: 'user-123', client: expect.anything() },
                { name: 'Acme Global Corp' },
            );
        });
    });

    describe('when organization is not found', () => {
        it('throws NotFoundError and skips activity/audit logs', async () => {
            vi.mocked(updateOrganizationById).mockResolvedValueOnce(null);

            await expect(
                updateCurrentOrganization(MOCK_UPDATE_INPUT, 'org-nonexistent', 'user-123'),
            ).rejects.toThrow(NotFoundError);

            expect(ActivityLogService.logOrganizationUpdated).not.toHaveBeenCalled();
            expect(AuditLogService.logOrganizationUpdated).not.toHaveBeenCalled();
        });
    });

    describe('when organization account is inactive / revoked', () => {
        it('throws ForbiddenError and skips activity/audit logs', async () => {
            vi.mocked(updateOrganizationById).mockResolvedValueOnce({
                ...MOCK_ORG_ROW,
                revokedAt: new Date('2026-02-01T00:00:00.000Z'),
            } as never);

            await expect(
                updateCurrentOrganization(MOCK_UPDATE_INPUT, 'org-123', 'user-123'),
            ).rejects.toThrow(ForbiddenError);

            expect(ActivityLogService.logOrganizationUpdated).not.toHaveBeenCalled();
            expect(AuditLogService.logOrganizationUpdated).not.toHaveBeenCalled();
        });
    });

    describe('when infrastructure dependencies fail', () => {
        it('propagates repository error', async () => {
            vi.mocked(updateOrganizationById).mockRejectedValueOnce(new Error('Database error'));

            await expect(
                updateCurrentOrganization(MOCK_UPDATE_INPUT, 'org-123', 'user-123'),
            ).rejects.toThrow('Database error');
        });
    });
});
