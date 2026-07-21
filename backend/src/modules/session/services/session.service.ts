import { env } from '#configs/env.js';

import { hashRefreshToken } from '#modules/auth/utils/auth.util.js';
import { generateTokens } from '#modules/auth/services/token.service.js';
import { addDuration } from '#shared/utils/date.util.js';

import type { JwtPayload } from '#modules/auth/types/auth.type.js';

import type { IssuedSessionResult } from '../types/session.type.js'


// This service function issues a new session by generating access and refresh tokens, 
// hashing the refresh token, and calculating the expiration date of the refresh token.
export async function issueSession(payload: JwtPayload): Promise<IssuedSessionResult> {

    const tokens = generateTokens(payload);

    const refreshTokenHash = await hashRefreshToken(tokens.refreshToken);

    const expiresAt = addDuration(new Date(), env.jwt.refreshTokenExpires);

    return {
        tokens,
        refreshTokenHash,
        expiresAt
    }
}