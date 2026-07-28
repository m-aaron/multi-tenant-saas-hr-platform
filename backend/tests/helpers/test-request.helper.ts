import request from 'supertest';

import app from '#app.js';

/**
 * Shared Supertest client.
 *
 * Usage:
 *
 * const response = await api
 *     .get('/api/v1/health');
 */
export const api = request(app);