export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    INVITED: 'invited',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];