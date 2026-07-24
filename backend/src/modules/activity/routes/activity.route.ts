import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';
import { requireRole } from '#middlewares/require-role.middleware.js';

import { validateQuery } from '#shared/validation/validate-query.js';

import { listActivityLogsQuerySchema } from '../schemas/activity.schema.js';

import { getActivityLogs, getActivityLogById } from '../controllers/activity.controller.js';


const router: Router = Router();

router.get(
    '/',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    validateQuery(listActivityLogsQuerySchema),
    getActivityLogs,
);

router.get(
    '/:activityId',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    getActivityLogById,
);

export default router;