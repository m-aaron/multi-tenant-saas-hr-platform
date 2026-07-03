export interface RegisterOrganizationInput {
    organizationName: string;
    organizationSlug: string;

    firstName: string;
    middleName?: string | undefined;
    lastName: string;
    nameExtension?: string;

    ownerEmail: string;
    password: string;
}

export interface JwtPayload {
    sub: string; // userId
    organizationId: string;
    roleId: string;
}
