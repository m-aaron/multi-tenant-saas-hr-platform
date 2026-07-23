import { Router } from 'express';

import { authenticate } from '#middlewares/authenticate.middleware.js';

import { getProfile } from '#modules/profile/controllers/profile.controller.js';


const router: Router = Router();

router.get(
    '/',
    authenticate,
    getProfile
);

export default router;
