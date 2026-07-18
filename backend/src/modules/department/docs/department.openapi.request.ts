const DepartmentNameSchema = {
    type: 'object',
    required: ['name'],
    properties: {
        name: {
            type: 'string',
            minLength: 3,
            maxLength: 100,
            description: 'Department name.',
        }
    },
};

export const CreateDepartmentRequestSchema = DepartmentNameSchema;
export const UpdateDepartmentRequestSchema = DepartmentNameSchema;
