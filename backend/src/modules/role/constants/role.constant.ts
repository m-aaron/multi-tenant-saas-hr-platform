export const DEFAULT_ROLES = [
    'Owner',
    'Administrator',
    'HR Manager',
    'Department Head',
    'Employee',
] as const;

export type RoleName = typeof DEFAULT_ROLES[number];