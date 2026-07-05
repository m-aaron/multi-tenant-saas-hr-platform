import { Router } from 'express';
import { registerOrganization } from '../controllers/auth.controller.js';


const router: Router = Router();

router.post('/register', registerOrganization);

export default router;