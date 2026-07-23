import { z } from 'zod';


export const updateProfileSchema = z.object({
    avatarUrl: z
        .url('Invalid avatar URL.')
        .max(2048)
        .nullable()
        .optional()
});

export const updatePasswordSchema = z.object({
    currentPassword: z
        .string()
        .trim()
        .min(1, 'Current password is required.')
        .min(8, 'Current password must be at least 8 characters long.'),
    newPassword: z
        .string()
        .trim()
        .min(1, 'New password is required.')
        .min(8, 'New password must be at least 8 characters long.')
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
