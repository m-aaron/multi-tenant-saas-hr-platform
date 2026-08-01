import { db } from '#databases/index.js';
import { env } from '#configs/env.js';


// Health check response interface
export interface HealthCheckResponse {
    status: 'ok' | 'unhealthy';
    database: 'connected' | 'disconnected';
    uptime: number; // seconds
    environment: string;
}

// Server startup time - set once when module is initialized
async function checkDatabaseConnection(): Promise<boolean> {
    try {
        // Simple query to verify connection - uses pool timeout
        const result = await db.query('SELECT 1');
        return result.rows.length > 0;
    } catch (error) {
        if (env.NODE_ENV !== 'test') {
            // Logging is intentionally kept for operational visibility in non-test environments.
            // eslint-disable-next-line no-console
            console.error('[HealthCheck] Database connection failed:', error instanceof Error ? error.message : error);
        }
        return false;
    }
}

/**
 * Comprehensive health check
 * Checks database, uptime, and environment
 * 2026 best practice: Non-blocking, with timeout
 */
export async function performHealthCheck(): Promise<HealthCheckResponse> {
    const isDbConnected = await checkDatabaseConnection();
    const uptimeMs = Math.floor(process.uptime());
    const environment = env.NODE_ENV ?? 'development';

    return {
        status: isDbConnected ? 'ok' : 'unhealthy',
        database: isDbConnected ? 'connected' : 'disconnected',
        uptime: uptimeMs,
        environment
    };
}