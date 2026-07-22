import { EMPLOYMENT_STATUSES } from '#modules/employee/constants/employee.constant.js';

export const CreateEmployeeRequestSchema = {
    type: 'object',
    required: ['firstName', 'lastName', 'jobTitle', 'employmentStatus', 'hireDate'],
    properties: {
        firstName: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Employee first name.',
        },
        middleName: {
            type: 'string',
            maxLength: 100,
            nullable: true,
            description: 'Employee middle name.',
        },
        lastName: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Employee last name.',
        },
        nameExtension: {
            type: 'string',
            maxLength: 20,
            nullable: true,
            description: 'Employee name extension (e.g. Jr., Sr., III).',
        },
        jobTitle: {
            type: 'string',
            minLength: 1,
            maxLength: 150,
            description: 'Employee job title.',
        },
        employmentStatus: {
            type: 'string',
            enum: EMPLOYMENT_STATUSES,
            description: 'Employment status of the employee.',
        },
        hireDate: {
            type: 'string',
            format: 'date-time',
            description: 'Date when the employee was hired.',
        },
        departmentId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'Department unique identifier.',
        },
    },
};

export const UpdateEmployeeRequestSchema = {
    type: 'object',
    properties: {
        firstName: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Employee first name.',
        },
        middleName: {
            type: 'string',
            maxLength: 100,
            nullable: true,
            description: 'Employee middle name.',
        },
        lastName: {
            type: 'string',
            minLength: 1,
            maxLength: 100,
            description: 'Employee last name.',
        },
        nameExtension: {
            type: 'string',
            maxLength: 20,
            nullable: true,
            description: 'Employee name extension (e.g. Jr., Sr., III).',
        },
        jobTitle: {
            type: 'string',
            minLength: 1,
            maxLength: 150,
            description: 'Employee job title.',
        },
        employmentStatus: {
            type: 'string',
            enum: EMPLOYMENT_STATUSES,
            description: 'Employment status of the employee.',
        },
        hireDate: {
            type: 'string',
            format: 'date-time',
            description: 'Date when the employee was hired.',
        },
        departmentId: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            description: 'Department unique identifier.',
        },
    },
};
