import { z } from 'zod';


const emailSchema = z
    .email('Invalid email address.')
    .trim()
    .toLowerCase();

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(100);

const employeeIdSchema = z.uuid('Invalid employee ID.');
const roleIdSchema = z.uuid('Invalid role ID.');


export const createUserSchema = z.object({
    employeeId: employeeIdSchema,
    roleId: roleIdSchema,
    email: emailSchema,
    password: passwordSchema
});

export type CreateUserInput = z.infer<typeof createUserSchema>;