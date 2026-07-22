import type { UserStatus } from '#modules/user/constants/user.constant.js';


export interface UserRow {
    id: string;
    employeeId: string;
    organizationId: string;
    roleId: string;
    email: string;
    status: UserStatus;
    createdAt: Date;
    updatedAt: Date;
}
