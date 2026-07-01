export interface SessionInput {
    organizationId: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}