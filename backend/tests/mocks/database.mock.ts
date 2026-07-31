import type { Pool } from 'pg';
import { vi } from 'vitest';

/**
 * Shared reusable mock for the PostgreSQL Pool singleton.
 *
 * Usage:
 *
 * vi.mock('#databases/index.js', () => ({
 *     db: mockDb,
 * }));
 */
export const mockDb = {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
} as unknown as Pool & {
    query: ReturnType<typeof vi.fn>;
    connect: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
};