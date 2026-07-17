import { z } from 'zod';

export const updateOrganizationSchema = z.object({
    organizationName: z
        .string()
        .trim()
        .min(3, 'Organization name must be at least 3 characters.')
        .max(255)
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;