import { z } from 'zod';


export const updateProfileSchema = z.object({
    avatarUrl: z
        .url('Invalid avatar URL.')
        .max(2048)
        .nullable()
        .optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
