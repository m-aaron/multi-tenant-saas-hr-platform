export const OWNER_EMPLOYEE_DEFAULTS = {
    jobTitle: 'owner',
    employmentStatus: 'regular',
} as const;

export const EMPLOYMENT_STATUSES = [
    'regular',
    'probationary',
    'contract',
    'resigned',
    'terminated'
] as const;

export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];