export const EMPLOYMENT_STATUSES = [
    'regular',
    'probationary',
    'contractual',
    'casual',
    'project-based',
    'seasonal',
    'apprentice',
    'intern'
];

export type EmploymentStatus = typeof EMPLOYMENT_STATUSES[number];