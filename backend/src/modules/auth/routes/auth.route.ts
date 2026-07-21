import { Router } from 'express';

import { validate } from '#shared/validation/validate.js';
import { registerOrganizationSchema } from '#modules/auth/schemas/registration.schema.js';
import { loginSchema } from '#modules/auth/schemas/login.schema.js';
import { refreshSchema } from '#modules/auth/schemas/refresh.schema.js';
import { logoutSchema } from '#modules/auth/schemas/logout.schema.js';

import { authenticate } from '#middlewares/authenticate.middleware.js';

import { 
    registerOrganization, 
    loginUser,
    refreshToken,
    logout,
    logoutAllSessions
} from '#modules/auth/controllers/auth.controller.js';


const router: Router = Router();

router.post('/register', validate(registerOrganizationSchema), registerOrganization);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', validate(refreshSchema), refreshToken);
router.post('/logout', validate(logoutSchema), logout);
router.post('/logout-all', authenticate, logoutAllSessions);

export default router;