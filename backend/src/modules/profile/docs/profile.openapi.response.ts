/**
 * ------------------------------------------------------------------
 * Profile Response Payload Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These schemas represent ONLY the payload stored inside
 * ApiSuccessResponse<T>.
 *
 * The standard API response envelope (success, message, data)
 * is generated globally by docs/openapi.response.ts.
 */

import { EMPLOYMENT_STATUSES } from '#modules/employee/constants/employee.constant.js';
import { USER_STATUSES } from '#modules/user/constants/user.constant.js';

const ProfileDetailsProfileSchema = {
    type: 'object',
    required: ['profileId', 'avatarUrl', 'createdAt', 'updatedAt'],
    properties: {
        profileId: {
            type: 'string',
            format: 'uuid',
            description: 'Profile unique identifier.'
        },
        avatarUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            description: 'URL of the user avatar image.'
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    }
};

const ProfileDetailsOrganizationSchema = {
    type: 'object',
    required: [
        'organizationId',
        'organizationName',
        'organizationSlug',
        'createdAt',
        'updatedAt'
    ],
    properties: {
        organizationId: {
            type: 'string',
            format: 'uuid',
            description: 'Organization unique identifier.'
        },
        organizationName: {
            type: 'string',
            description: 'Organization name.'
        },
        organizationSlug: {
            type: 'string',
            description: 'Organization slug.'
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    }
};

const ProfileDetailsRoleSchema = {
    type: 'object',
    required: ['roleId', 'roleName'],
    properties: {
        roleId: {
            type: 'string',
            format: 'uuid',
            description: 'Role unique identifier.'
        },
        roleName: {
            type: 'string',
            description: 'Role name.'
        }
    }
};

const ProfileDetailsUserSchema = {
    type: 'object',
    required: ['userId', 'email', 'status', 'createdAt', 'updatedAt'],
    properties: {
        userId: {
            type: 'string',
            format: 'uuid',
            description: 'User unique identifier.'
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
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    }
};

const ProfileDetailsDepartmentSchema = {
    type: 'object',
    required: ['departmentId', 'departmentName'],
    properties: {
        departmentId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'Department unique identifier.'
        },
        departmentName: {
            type: 'string',
            nullable: true,
            description: 'Department name.'
        }
    }
};

const ProfileDetailsEmployeeSchema = {
    type: 'object',
    required: [
        'employeeId',
        'employeeNumber',
        'firstName',
        'middleName',
        'lastName',
        'nameExtension',
        'jobTitle',
        'employmentStatus',
        'hireDate',
        'createdAt',
        'updatedAt'
    ],
    properties: {
        employeeId: {
            type: 'string',
            format: 'uuid',
            description: 'Employee unique identifier.'
        },
        employeeNumber: {
            type: 'string',
            description: 'Unique employee number assigned within the organization.'
        },
        firstName: {
            type: 'string',
            description: 'Employee first name.'
        },
        middleName: {
            type: 'string',
            nullable: true,
            description: 'Employee middle name.'
        },
        lastName: {
            type: 'string',
            description: 'Employee last name.'
        },
        nameExtension: {
            type: 'string',
            nullable: true,
            description: 'Employee name extension.'
        },
        jobTitle: {
            type: 'string',
            description: 'Employee job title.'
        },
        employmentStatus: {
            type: 'string',
            enum: EMPLOYMENT_STATUSES,
            description: 'Employment status.'
        },
        hireDate: {
            type: 'string',
            format: 'date-time',
            description: 'Hire date.'
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    }
};

export const ProfileDetailsPayloadSchema = {
    type: 'object',
    required: ['profile', 'organization', 'role', 'user', 'department', 'employee'],
    properties: {
        profile: ProfileDetailsProfileSchema,
        organization: ProfileDetailsOrganizationSchema,
        role: ProfileDetailsRoleSchema,
        user: ProfileDetailsUserSchema,
        department: {
            oneOf: [
                ProfileDetailsDepartmentSchema,
                { type: 'null' }
            ],
            description: 'Department details, or null if not assigned.'
        },
        employee: ProfileDetailsEmployeeSchema
    }
};

export const ProfileRowPayloadSchema = {
    type: 'object',
    required: ['id', 'userId', 'avatarUrl', 'createdAt', 'updatedAt'],
    properties: {
        id: {
            type: 'string',
            format: 'uuid',
            description: 'Profile unique identifier.'
        },
        userId: {
            type: 'string',
            format: 'uuid',
            description: 'User unique identifier.'
        },
        avatarUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            description: 'URL of the user avatar image.'
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        }
    }
};
