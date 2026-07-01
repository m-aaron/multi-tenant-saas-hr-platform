import { hashRefreshToken } from './session.util.js';
import { generateTokens } from './token.service.js';
import type { JwtPayload } from './auth.type.js';
import type { TokenPair } from './session.type.js';


export async function createSession(payload: JwtPayload): Promise<{ tokens: TokenPair; refreshTokenHash: string }> {
    const tokens = generateTokens(payload);
    const refreshTokenHash = await hashRefreshToken(tokens.refreshToken);
    
    return { tokens, refreshTokenHash };
}