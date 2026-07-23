import type { EmploymentStatus } from "#modules/employee/constants/employee.constant.js";

interface Profile {
    profileId: string;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}

interface Organization {
    organizationId: string;
    organizationName: string;
    organizationSlug: string;
    createdAt: Date;
    updatedAt: Date;
}

interface Role {
    roleId: string;
    roleName: string;
}

interface User {
    userId: string;
    email: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

interface Department {
    departmentId: string | null;
    departmentName: string | null;
}

interface Employee {
    employeeId: string;
    employeeNumber: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    nameExtension: string | null;
    jobTitle: string;
    employmentStatus: EmploymentStatus;
    hireDate: Date;
    createdAt: Date;
    updatedAt: Date;
}

export type ProfileDetails = {
    profile: Profile;
    organization: Organization;
    role: Role;
    user: User;
    department: Department | null;
    employee: Employee;
}