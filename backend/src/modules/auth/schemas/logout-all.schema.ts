import { z } from 'zod';

export const logoutAllSessionsSchema = z.object({
    refreshToken: z
        .string()
        .min(1, 'Refresh token is required.')
        .trim(),
});

export type LogoutAllSessionsInput = z.infer<typeof logoutAllSessionsSchema>;