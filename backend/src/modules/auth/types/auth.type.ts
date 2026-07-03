export interface RegisterOrganizationInput {
    organizationName: string;
    organizationSlug: string;

    firstName: string;
    middleName: string | null;
    lastName: string;
    nameExtension: string | null;

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
