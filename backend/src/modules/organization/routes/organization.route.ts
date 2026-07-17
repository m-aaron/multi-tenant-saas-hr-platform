import { Router } from "express";

import { authenticate } from "#middlewares/authenticate.middleware.js";
import { requireRole } from "#middlewares/require-role.middleware.js";

import { validate } from "#shared/validation/validate.js";

import { updateOrganizationSchema } from "../schemas/organization.schema.js";

import { 
    getCurrentOrganization,
    updateCurrentOrganization
} from "../controllers/organization.controller.js";


const router: Router = Router();

router.get(
    '/me', 
    authenticate, 
    requireRole('owner', 'administrator'), 
    getCurrentOrganization
);

router.patch(
    '/me', 
    authenticate, 
    requireRole('owner', 'administrator'), 
    validate(updateOrganizationSchema),
    updateCurrentOrganization
);


export default router;