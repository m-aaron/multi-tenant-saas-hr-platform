export const AUDIT_ACTIONS = {
    LOGIN: 'login',
    LOGIN_FAILED: 'login_failed',
    LOGOUT: 'logout',
    LOGOUT_ALL: 'logout_all',

    REGISTERED: 'registered',
    CREATED: 'created',
    UPDATED: 'updated',
    ARCHIVED: 'archived',
    INVITED: 'invited',

    REACTIVATED: 'reactivated',

    PASSWORD_CHANGED: 'password_changed',

} as const;

export type AuditAction = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];


export const AUDIT_ENTITIES = {
    ORGANIZATION: 'organization',
    DEPARTMENT: 'department',
    EMPLOYEE: 'employee',
    USER: 'user',
    PROFILE: 'profile',
    SESSION: 'session',
} as const;

export type AuditEntity = typeof AUDIT_ENTITIES[keyof typeof AUDIT_ENTITIES];
