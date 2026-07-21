import z from 'zod';


const emailSchema = z
    .email('Invalid email address.')
    .trim()
    .toLowerCase();


const createUserSchema = z.object({
    email: emailSchema
});

export type CreateUserInput = z.infer<typeof createUserSchema>;