import type { EmploymentStatus } from "../constants/auth.constant.js";
import type { UserStatus } from "#modules/user/constants/user.constant.js";
import type { RoleName } from "#modules/role/constants/role.constant.js";
export interface CreateOrganizationInput {
    name: string;
    slug: string;
}

export interface CreateEmployeeInput {
    organizationId: string;

    employeeNumber: string;

    firstName: string;
    middleName?: string | undefined;
    lastName: string;
    nameExtension?: string | undefined;

    jobTitle: string;

    employmentStatus: EmploymentStatus;

    hireDate: string;
}

export interface CreateUserInput {
    employeeId: string;
    organizationId: string;
    roleId: string;

    email: string;
    passwordHash: string;
}

export interface CreateProfileInput {
    userId: string;
}

export interface FindLoginUserInput {
    organizationSlug: string;
    email: string;
}

export interface UserLoginRow {
    id: string,
    employeeId: string,
    organizationId: string,
    roleId: string,
    email: string,
    passwordHash: string,
    status: UserStatus
}

export interface LoginResult {

    user: {
        id: string;
        organizationId: string;
        employeeId: string | null;
        roleId: string;
        email: string;
    };

    tokens: TokenPair;

}

export interface JwtPayload {
    sid: string; // sessionId
    sub: string; // userId
    organizationId: string;
    roleId: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export interface AuthenticatedUserRecord {
    id: string;
    organizationId: string;
    organizationDeletedAt: Date | null
    employeeId: string;
    roleId: string;
    roleName: RoleName;
    email: string;
    status: UserStatus;
    userDeletedAt: Date | null;
}