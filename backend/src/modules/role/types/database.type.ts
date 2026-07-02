import type { RoleName } from '../constants/role.constant.js';

export interface RoleRow {
    id: string;
    organization_id: string;
    name: RoleName;
}