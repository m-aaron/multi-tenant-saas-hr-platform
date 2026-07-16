import { Router, type Router as ExpressRouter } from 'express';
import { performHealthCheck } from '#modules/health/services/health.service.js';

const router: ExpressRouter = Router();

router.get('/health', async (_req, res) => {
  const healthStatus = await performHealthCheck();

  res.status(healthStatus.status === 'ok' ? 200 : 503).json(healthStatus);
});

export default router;