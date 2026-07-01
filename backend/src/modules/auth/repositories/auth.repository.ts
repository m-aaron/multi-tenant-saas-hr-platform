import type { CreateUserInput } from '../types/auth.type.js';


export async function createUser(input: CreateUserInput): Promise<void> {
    console.log('Creating user with input:', input);
}