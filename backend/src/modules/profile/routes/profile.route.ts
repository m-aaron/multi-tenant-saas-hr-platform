import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';

import { validate } from '#shared/validation/validate.js';

import { updatePasswordSchema, updateProfileSchema } from '#modules/profile/schemas/profile.schema.js';

import {
    getProfile,
    updateProfile,
    updatePassword
} from '#modules/profile/controllers/profile.controller.js';


const router: Router = Router();

router.get(
    '/',
    authenticate,
    getProfile
);

router.patch(
    '/',
    authenticate,
    validate(updateProfileSchema),
    updateProfile
);

router.patch(
    '/password',
    authenticate,
    validate(updatePasswordSchema),
    updatePassword
);

export default router;
