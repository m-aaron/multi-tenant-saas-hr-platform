import type { EmploymentStatus } from "#modules/employee/constants/employee.constant.js";


export interface EmployeeRow {
    id: string;
    organizationId: string;
    departmentId: string | null;
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
