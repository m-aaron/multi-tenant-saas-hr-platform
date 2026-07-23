export const UpdateProfileRequestSchema = {
    type: 'object',
    properties: {
        avatarUrl: {
            type: 'string',
            format: 'uri',
            maxLength: 2048,
            nullable: true,
            description: 'URL of the user avatar image. Pass null to remove the avatar.'
        }
    }
};

export const UpdatePasswordRequestSchema = {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
        currentPassword: {
            type: 'string',
            minLength: 8,
            description: 'Current account password.'
        },
        newPassword: {
            type: 'string',
            minLength: 8,
            description: 'New account password.'
        }
    }
};
