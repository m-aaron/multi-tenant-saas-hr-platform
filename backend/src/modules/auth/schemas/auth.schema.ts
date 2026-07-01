import { z } from 'zod';

export const registerSchema = z.object({
    organizationName: z.string().min(1, 'Organization name is required'),
    organizationSlug: z.string().min(1, 'Organization slug is required'),
    firstName: z.string().min(1, 'First name is required'),
    middleName: z.string().optional(),
    lastName: z.string().min(1, 'Last name is required'),
    nameExtension: z.string().optional(),
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const loginSchema = z.object({
    email: z.email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
}); 