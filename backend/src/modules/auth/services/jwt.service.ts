import jwt, { type SignOptions } from 'jsonwebtoken';

import { env } from '#configs/env.js';
import type { JwtPayload } from '../types/auth.type.js';

import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';

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
        env.jwt.accessTokenSecret,
        buildOptions(
            env.jwt.accessTokenExpires,
        ),
    );
}

export function signRefreshToken(payload: JwtPayload): string {
    return jwt.sign(
        payload,
        env.jwt.refreshTokenSecret,
        buildOptions(
            env.jwt.refreshTokenExpires,
        ),
    );
}

export function verifyAccessToken(token: string): JwtPayload {
    try {
        return jwt.verify(
            token,
            env.jwt.accessTokenSecret,
        ) as JwtPayload;
    } catch {
        throw new UnauthorizedError('Invalid or expired access token.');
    }
}

export function verifyRefreshToken(token: string): JwtPayload {
    try {
        return jwt.verify(
            token,
            env.jwt.refreshTokenSecret,
        ) as JwtPayload;
    } catch {
        throw new UnauthorizedError('Invalid or expired refresh token.');
    }
}