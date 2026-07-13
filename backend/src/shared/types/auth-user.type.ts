export interface AuthenticatedUser {
    id: string;
    organizationId: string;
    employeeId: string;
    roleId: string;
    email: string;
    status: string;
}