/**
 * ------------------------------------------------------------------
 * Employee Response Payload Schemas (OpenAPI 3.1.0)
 * ------------------------------------------------------------------
 *
 * These schemas represent ONLY the payload stored inside
 * ApiSuccessResponse<T>.
 *
 * The standard API response envelope (success, message, data)
 * is generated globally by docs/openapi.response.ts.
 */

import { EMPLOYMENT_STATUSES } from '#modules/employee/constants/employee.constant.js';

export const EmployeePayloadSchema = {
    type: 'object',
    required: [
        'id',
        'organizationId',
        'departmentId',
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
        id: {
            type: 'string',
            format: 'uuid',
            description: 'Employee unique identifier.'
        },
        organizationId: {
            type: 'string',
            format: 'uuid',
            description: 'Organization unique identifier.'
        },
        departmentId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'Department unique identifier.'
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

export const EmployeeListPayloadSchema = {
    type: 'array',
    items: EmployeePayloadSchema,
    description: 'List of employees.'
};

export const DeleteEmployeePayloadSchema = {
    type: 'null' as const
};
