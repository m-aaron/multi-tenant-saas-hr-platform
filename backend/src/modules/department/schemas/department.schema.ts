import { z } from 'zod';

export const createDepartmentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'Department name must be at least 3 characters.')
        .max(255)
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;


export const updateDepartmentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, 'Department name must be at least 3 characters.')
        .max(255)
});

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;