import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';

import { validate } from '#shared/validation/validate.js';

import { updateProfileSchema } from '#modules/profile/schemas/profile.schema.js';

import {
    getProfile,
    updateProfile
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

export default router;
