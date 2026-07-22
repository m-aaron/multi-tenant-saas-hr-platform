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
    employmentStatus: string;
    hireDate: Date;
    createdAt: Date;
    updatedAt: Date;
}
