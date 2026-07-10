import type { TokenPair } from "#modules/auth/types/auth.type.js";


export interface CreateSessionInput {
    organizationId: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
}

export interface IssuedSessionResult {
    tokens: TokenPair;
    refreshTokenHash: string;
    expiresAt: Date;
}