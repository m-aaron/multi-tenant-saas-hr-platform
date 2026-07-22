import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';
import { requireRole } from '#middlewares/require-role.middleware.js';

import { validate } from '#shared/validation/validate.js';

import { createEmployeeSchema, updateEmployeeSchema } from '#modules/employee/schemas/employee.schema.js';

import { 
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} from '#modules/employee/controllers/employee.controller.js';


const router: Router = Router();

router.get(
    '/',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    getEmployees
);

router.get(
    '/:employeeId',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    getEmployeeById
);

router.post(
    '/',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    validate(createEmployeeSchema),
    createEmployee
);

router.patch(
    '/:employeeId',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    validate(updateEmployeeSchema),
    updateEmployee
);

router.delete(
    '/:employeeId',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    deleteEmployee
);

export default router;