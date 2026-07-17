import { Router } from "express";

import { authenticate } from "#middlewares/authenticate.middleware.js";
import { requireRole } from "#middlewares/require-role.middleware.js";

import { getCurrentOrganization } from "../controllers/organization.controller.js";


const router: Router = Router();

router.get(
    '/me', 
    authenticate, 
    requireRole('owner', 'administrator'), 
    getCurrentOrganization
);


export default router;