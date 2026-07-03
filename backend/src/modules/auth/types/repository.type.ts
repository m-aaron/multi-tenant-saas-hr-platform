import type { EmploymentStatus } from "./employee-status.type.js";

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