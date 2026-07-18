import { Router } from "express";

import { authenticate } from "#middlewares/authenticate.middleware.js";
import { requireRole } from "#middlewares/require-role.middleware.js";

import { validate } from "#shared/validation/validate.js";
import { createDepartmentSchema } from "../schemas/department.schema.js";
import { createDepartment } from "../controllers/department.controller.js";


const router: Router = Router();

router.post(
    '/',
    authenticate,
    requireRole('owner', 'administrator'),
    validate(createDepartmentSchema),
    createDepartment
);

export default router;
