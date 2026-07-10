import { env } from '#config/env.js';

import { hashRefreshToken } from '../../auth/utils/session.util.js';
import { generateTokens } from '../../auth/token.service.js';
import { addDuration } from '#shared/utils/date.js';

import type { JwtPayload } from '../../auth/types/auth.type.js';

import type { IssuedSessionResult } from '../types/session.type.js'


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