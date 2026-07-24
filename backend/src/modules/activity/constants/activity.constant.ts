export const ACTIVITY_EVENTS = {
    ORGANIZATION_UPDATED: 'organization.updated',

    DEPARTMENT_CREATED: 'department.created',
    DEPARTMENT_UPDATED: 'department.updated',
    DEPARTMENT_ARCHIVED: 'department.archived',

    EMPLOYEE_CREATED: 'employee.created',
    EMPLOYEE_UPDATED: 'employee.updated',
    EMPLOYEE_ARCHIVED: 'employee.archived',

    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_INVITED: 'user.invited',
    USER_REACTIVATED: 'user.reactivated',

    PROFILE_UPDATED: 'profile.updated',
    PROFILE_PASSWORD_CHANGED: 'profile.password.changed',
} as const;

export type ActivityEvent = typeof ACTIVITY_EVENTS[keyof typeof ACTIVITY_EVENTS];