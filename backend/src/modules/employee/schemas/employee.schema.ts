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
        .optional(),

    lastName: z
        .string()
        .trim()
        .min(1, 'Last name must be at least 1 character.')
        .max(100),

    nameExtension: z
        .string()
        .trim()
        .max(20)
        .optional(),
};

const employeeDetailsFields = {
    jobTitle: z
        .string()
        .trim()
        .min(1)
        .max(150),

    employmentStatus: z
        .enum(EMPLOYMENT_STATUSES),

    hireDate: z
        .date()
        .transform((date) => new Date(date)),
};

export const createEmployeeSchema = z.object({
    ...employeeNameFields,
    ...employeeDetailsFields
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
