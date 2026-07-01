import { hashPassword } from '#shared/security/password.js';
import { createUser } from '../repositories/auth.repository.js';
import type { CreateUserInput, RegisterInput } from '../types/auth.type.js';


export async function registerUser(input: RegisterInput): Promise<void> {
    // Hash the password
    const passwordHash = await hashPassword(input.password);

    // Create user input with hashed password
    const createUserInput: CreateUserInput = {
        ...input,
        passwordHash,
    } as CreateUserInput;

    // Create a new user with the hashed password
    await createUser(createUserInput);
}
