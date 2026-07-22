export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    INVITED: 'invited',
} as const;

export const USER_STATUSES = [
    USER_STATUS.ACTIVE,
    USER_STATUS.INACTIVE,
    USER_STATUS.INVITED,
] as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];