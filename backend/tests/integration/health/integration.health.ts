import { api } from '#helpers/test-request.helper.js';

describe('Health Module', () => {
    describe('GET /api/v1/health', () => {
        it('should return the application health status', async () => {
            const response = await api.get('/api/v1/health');

            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('application/json');

            expect(response.body.status).toBe('ok');
            expect(response.body.database).toBe('connected');
            expect(response.body.environment).toBe('test');
            expect(typeof response.body.uptime).toBe('number');
            expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        });
    });
});