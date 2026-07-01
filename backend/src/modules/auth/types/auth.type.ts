export interface LoginInput {
    email: string;
    password: string;
}

export interface RegisterInput extends LoginInput {
    organizationName: string;
    organizationSlug: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    nameExtension?: string;
}

export interface CreateUserInput extends Omit<RegisterInput, 'password'> {
    passwordHash: string;
}

export interface JwtPayload {
    sub: string; // userId
    organizationId: string;
    roleId: string;
}
