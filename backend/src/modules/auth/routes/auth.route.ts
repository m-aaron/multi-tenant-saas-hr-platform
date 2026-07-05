import { Router } from 'express';

import { validate } from '#shared/validation/validate.js';
import { registerOrganizationSchema } from '../schemas/auth.schema.js';

import { registerOrganization } from '../controllers/auth.controller.js';


const router: Router = Router();

router.post('/register', validate(registerOrganizationSchema), registerOrganization);

export default router;