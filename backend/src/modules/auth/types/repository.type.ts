import type { EmploymentStatus } from "./employee-status.type.js";

export interface CreateOrganizationInput {
    name: string;
    slug: string;
}

export interface CreateEmployeeInput {
    organizationId: string;

    employeeNumber: string;

    firstName: string;
    middleName: string | null;
    lastName: string;
    nameExtension: string | null;

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
    avatarUrl?: string;
}