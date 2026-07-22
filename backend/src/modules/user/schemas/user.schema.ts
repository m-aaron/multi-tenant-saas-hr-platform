import { z } from 'zod';

import { USER_STATUSES } from '#modules/user/constants/user.constant.js';


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

const userStatusSchema = z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().toLowerCase() : val),
    z.enum(USER_STATUSES, {
        message: 'Invalid user status.'
    })
);


export const createUserSchema = z.object({
    employeeId: employeeIdSchema,
    roleId: roleIdSchema,
    email: emailSchema,
    password: passwordSchema
});

export const updateUserSchema = createUserSchema
    .extend({
        status: userStatusSchema
    })
    .partial();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;