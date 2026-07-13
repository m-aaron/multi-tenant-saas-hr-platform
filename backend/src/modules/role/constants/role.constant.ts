export const DEFAULT_ROLES = [
    'owner',
    'administrator',
    'hr_manager',
    'department_head',
    'employee'
] as const;

export type RoleName = typeof DEFAULT_ROLES[number];