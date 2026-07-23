import { USER_STATUSES } from '#modules/user/constants/user.constant.js';

export const CreateUserRequestSchema = {
    type: 'object',
    required: ['employeeId', 'roleId', 'email', 'password'],
    properties: {
        employeeId: {
            type: 'string',
            format: 'uuid',
            description: 'Employee unique identifier.'
        },
        roleId: {
            type: 'string',
            format: 'uuid',
            description: 'Role unique identifier.'
        },
        email: {
            type: 'string',
            format: 'email',
            description: 'User email address.'
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 100,
            description: 'User account password.'
        }
    }
};

export const InviteUserRequestSchema = {
    type: 'object',
    required: ['employeeId', 'roleId', 'email'],
    properties: {
        employeeId: {
            type: 'string',
            format: 'uuid',
            description: 'Employee unique identifier.'
        },
        roleId: {
            type: 'string',
            format: 'uuid',
            description: 'Role unique identifier.'
        },
        email: {
            type: 'string',
            format: 'email',
            description: 'User email address.'
        }
    }
};

export const UpdateUserRequestSchema = {
    type: 'object',
    properties: {
        roleId: {
            type: 'string',
            format: 'uuid',
            description: 'Role unique identifier.'
        },
        email: {
            type: 'string',
            format: 'email',
            description: 'User email address.'
        },
        status: {
            type: 'string',
            enum: USER_STATUSES,
            description: 'User account status.'
        },
        password: {
            type: 'string',
            minLength: 8,
            maxLength: 100,
            description: 'User account password.'
        }
    }
};
