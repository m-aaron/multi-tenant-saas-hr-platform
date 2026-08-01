export const MOCK_INPUT = {
    organizationSlug: 'test-org',
    email: 'user@example.com',
    password: 'Password123',
};

export const MOCK_ORG = {
    id: 'org-123',
    name: 'Test Org',
    slug: 'test-org',
};

export const MOCK_USER = {
    id: 'user-123',
    organizationId: 'org-123',
    employeeId: 'emp-123',
    roleId: 'role-123',
    email: 'user@example.com',
    passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$hash',
    status: 'active',
};

export const MOCK_TOKENS = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
};

export const MOCK_ISSUED_SESSION = (mockExpiresAt: Date = new Date('2026-12-31T23:59:59.000Z')) => ({
    tokens: MOCK_TOKENS,
    sessionId: 'session-123',
    refreshTokenHash: 'hash-123',
    expiresAt: mockExpiresAt
});

export const MOCK_REGISTER_INPUT = {
    name: 'Test Org',
    slug: 'test-org',
    ownerEmail: 'owner@example.com',
    password: 'Password123!',
    firstName: 'John',
    lastName: 'Doe',
};

export const MOCK_JWT_PAYLOAD = {
    sid: 'session-123',
    sub: 'user-123',
    organizationId: 'org-123',
    roleId: 'role-123',
};

export const MOCK_SESSION = (overrides = {}) => ({
    id: 'session-123',
    organizationId: 'org-123',
    userId: 'user-123',
    refreshTokenHash: 'hash-123',
    expiresAt: new Date('2026-12-31T23:59:59.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    lastUsedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
});