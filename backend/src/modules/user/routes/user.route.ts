import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';
import { requireRole } from '#middlewares/require-role.middleware.js';

import { validate } from '#shared/validation/validate.js';

import { createUserSchema, updateUserSchema } from '#modules/user/schemas/user.schema.js';

import { 
    createUser,
    getUsers,
    getUserById,
    updateUser,
    activateUser
} from '#modules/user/controllers/user.controller.js';


const router: Router = Router();

router.get(
    '/',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    getUsers
);

router.get(
    '/:userId',
    authenticate,
    requireRole('owner', 'administrator', 'hr_manager'),
    getUserById
);

router.post(
    '/',
    authenticate,
    requireRole('owner', 'administrator'),
    validate(createUserSchema),
    createUser
);

router.patch(
    '/:userId',
    authenticate,
    requireRole('owner', 'administrator'),
    validate(updateUserSchema),
    updateUser
);

router.patch(
    '/:userId/activate',
    authenticate,
    requireRole('owner', 'administrator'),
    activateUser
);

export default router;
