import { z } from 'zod';

import { EMPLOYMENT_STATUSES } from '#modules/employee/constants/employee.constant.js';


const employeeNameFields = {
    firstName: z
        .string()
        .trim()
        .min(1, 'First name must be at least 1 character.')
        .max(100),

    middleName: z
        .string()
        .trim()
        .max(100)
        .optional()
        .nullable(),

    lastName: z
        .string()
        .trim()
        .min(1, 'Last name must be at least 1 character.')
        .max(100),

    nameExtension: z
        .string()
        .trim()
        .max(20)
        .optional()
        .nullable(),
};

const employeeDetailsFields = {
    jobTitle: z
        .string()
        .trim()
        .min(1, 'Job title is required.')
        .max(150),

    employmentStatus: z.preprocess(
        (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
        z.enum(EMPLOYMENT_STATUSES, {
            message: 'Invalid employment status.'
        })
    ),

    hireDate: z
        .coerce
        .date(),
};

const departmentIdSchema = z
        .uuid('Invalid department ID.')
        .optional()
        .nullable();

export const createEmployeeSchema = z.object({
        ...employeeNameFields,
        ...employeeDetailsFields,
        departmentId: departmentIdSchema
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;