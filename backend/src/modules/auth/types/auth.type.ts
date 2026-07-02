export interface RegisterOrganizationInput {
    organizationName: string;
    organizationSlug: string;

    firstName: string;
    middleName?: string;
    lastName: string;
    nameExtension?: string;

    ownerEmail: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

export interface JwtPayload {
    sub: string; // userId
    organizationId: string;
    roleId: string;
}
