import { hashPassword, verifyPassword } from '#shared/security/password.js';


export async function hashRefreshToken(token: string): Promise<string> {
    return hashPassword(token);
}

export async function compareRefreshTokenHash(hashedToken: string, token: string): Promise<boolean> {
    return verifyPassword(hashedToken, token);
}