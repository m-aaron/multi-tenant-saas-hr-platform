import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';
import { requireRole } from '#middlewares/require-role.middleware.js';

import { validate } from '#shared/validation/validate.js';

import { createEmployeeSchema } from '#modules/employee/schemas/employee.schema.js';

import { createEmployee } from '#modules/employee/controllers/employee.controller.js';


const router: Router = Router();

router.post(
    '/',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    validate(createEmployeeSchema),
    createEmployee
);

export default router;
