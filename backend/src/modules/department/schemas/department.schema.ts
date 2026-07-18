import { z } from 'zod';

const departmentBaseSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'Department name must be at least 3 characters.')
        .max(100)
});

export const createDepartmentSchema = departmentBaseSchema;
export const updateDepartmentSchema = departmentBaseSchema;

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;