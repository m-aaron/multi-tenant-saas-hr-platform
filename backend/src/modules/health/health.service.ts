import { db } from '#database/index.js';
import { env } from '#config/env.js';


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
        console.error('[HealthCheck] Database connection failed:', error instanceof Error ? error.message : error);
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