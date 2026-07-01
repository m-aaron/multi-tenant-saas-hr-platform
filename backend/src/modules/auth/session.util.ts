import { hashPassword } from '#shared/security/password.js';


export async function hashRefreshToken(token: string): Promise<string> {
    return hashPassword(token);
}