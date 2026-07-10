import { z } from 'zod';

export const loginSchema = z.object({
    organizationSlug: z
        .string()
        .min(1, 'Organization slug is required.')
        .trim()
        .toLowerCase(),

    email: z
        .email('Invalid email address.')
        .trim()
        .toLowerCase(),

    password: z
        .string()
        .min(1, 'Password is required.'),
});

export type LoginInput = z.infer<typeof loginSchema>;