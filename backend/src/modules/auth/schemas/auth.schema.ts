import { z } from 'zod';

export const registerOrganizationSchema = z.object({

    organizationName: z
        .string()
        .trim()
        .min(3, 'Organization name must be at least 3 characters.')
        .max(255),

    organizationSlug: z
        .string()
        .trim()
        .min(3)
        .max(100)
        .regex(
            /^[a-z0-9-]+$/,
            'Organization slug may only contain lowercase letters, numbers, and hyphens.',
        ),

    ownerEmail: z
        .email('Invalid email address.')
        .trim()
        .toLowerCase(),

    password: z
        .string()
        .min(8, 'Password must be at least 8 characters.')
        .max(100),

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
});


export type RegisterOrganizationSchema = z.infer<typeof registerOrganizationSchema>;