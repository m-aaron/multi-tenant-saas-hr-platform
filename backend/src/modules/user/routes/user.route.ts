import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';
import { requireRole } from '#middlewares/require-role.middleware.js';

import { validate } from '#shared/validation/validate.js';

import { createUserSchema } from '#modules/user/schemas/user.schema.js';

import { 
    createUser
} from '#modules/user/controllers/user.controller.js';


const router: Router = Router();

router.post(
    '/',
    authenticate,
    requireRole('owner', 'administrator'),
    validate(createUserSchema),
    createUser
);

export default router;
