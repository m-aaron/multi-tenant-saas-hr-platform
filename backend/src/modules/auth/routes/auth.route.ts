import { Router } from 'express';

import { validate } from '#shared/validation/validate.js';
import { registerOrganizationSchema } from '../schemas/auth.schema.js';
import { loginSchema } from '../schemas/login.schema.js';

import { 
    registerOrganization, 
    loginUser
} from '../controllers/auth.controller.js';


const router: Router = Router();

router.post('/register', validate(registerOrganizationSchema), registerOrganization);
router.post('/login', validate(loginSchema), loginUser);

export default router;