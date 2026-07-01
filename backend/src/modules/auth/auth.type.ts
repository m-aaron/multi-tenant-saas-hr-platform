export interface JwtPayload {
    sub: string; // userId
    organizationId: string;
    roleId: string;
}

export interface JwtConfig {
    accessSecret: string;
    accessExpires: string;

    refreshSecret: string;
    refreshExpires: string;
}