import { z } from 'zod';


const nameSchema = z
    .string()
    .trim()
    .min(3, 'Organization name must be at least 3 characters.')
    .max(100);


const slugSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Organization slug is required.')
    .max(100);


export const createOrganizationSchema = z.object({
    name: nameSchema,
    slug: slugSchema,
});

export const updateOrganizationSchema = z.object({
    name: nameSchema
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;