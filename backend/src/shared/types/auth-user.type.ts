export interface AuthenticatedUser {
    id: string;
    organizationId: string;
    employeeId: string;
    roleId: string;
    roleName: string;
    email: string;
    status: string;
}