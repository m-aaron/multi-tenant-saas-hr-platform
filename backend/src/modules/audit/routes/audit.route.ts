import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';
import { requireRole } from '#middlewares/require-role.middleware.js';

import { validateQuery } from '#shared/validation/validate-query.js';

import { listAuditLogsQuerySchema } from '../schemas/audit.schema.js';

import { getAuditLogs, getAuditLogById } from '../controllers/audit.controller.js';


const router: Router = Router();

router.get(
    '/',
    authenticate,
    requireRole('owner', 'administrator'),
    validateQuery(listAuditLogsQuerySchema),
    getAuditLogs,
);

router.get(
    '/:auditId',
    authenticate,
    requireRole('owner', 'administrator'),
    getAuditLogById,
);

export default router;