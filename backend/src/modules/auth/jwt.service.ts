import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '#config/env.js';
import type { JwtPayload } from './auth.type.js';

type ExpiresIn = NonNullable<SignOptions['expiresIn']>;

function buildOptions(expiresIn?: string): SignOptions {
    if (!expiresIn) {
        return {};
    }

    const normalizedExpiresIn: ExpiresIn = /^\d+$/.test(expiresIn)
        ? Number(expiresIn)
        : (expiresIn as ExpiresIn);

    return {
        expiresIn: normalizedExpiresIn,
    };
}

export function signAccessToken(payload: JwtPayload): string {
    return jwt.sign(
        payload,
        env.accessTokenSecret,
        buildOptions(
            env.accessTokenExpires,
        ),
    );
}

export function signRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
        payload,
        env.refreshTokenSecret,
        buildOptions(
            env.refreshTokenExpires,
        ),
    );
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(
        token,
        env.accessTokenSecret,
    ) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(
        token,
        env.refreshTokenSecret,
    ) as JwtPayload;
}