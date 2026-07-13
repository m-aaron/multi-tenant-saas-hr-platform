import { Router } from 'express';

import { validate } from '#shared/validation/validate.js';
import { registerOrganizationSchema } from '../schemas/registration.schema.js';
import { loginSchema } from '../schemas/login.schema.js';
import { refreshSchema } from '../schemas/refresh.schema.js';
import { logoutSchema } from '../schemas/logout.schema.js';
import { logoutAllSessionsSchema } from '../schemas/logout-all.schema.js';

import { 
    registerOrganization, 
    loginUser,
    refreshToken,
    logout,
    logoutAllSessions
} from '../controllers/auth.controller.js';


const router: Router = Router();

router.post('/register', validate(registerOrganizationSchema), registerOrganization);
router.post('/login', validate(loginSchema), loginUser);
router.post('/refresh', validate(refreshSchema), refreshToken);
router.post('/logout', validate(logoutSchema), logout);
router.post('/logout-all', validate(logoutAllSessionsSchema), logoutAllSessions);

export default router;