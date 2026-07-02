import { hashPassword } from '#shared/security/password.js';
import { transaction } from '#shared/database/transaction.js';
import { 
    createOrganization,
    getOwnerRoleId,
    createUser,
    createProfile,
} from '../repositories/auth.repository.js';
import type { RegisterInput } from '../types/auth.type.js';


export async function registerUser(input: RegisterInput): Promise<void> {
    
    await transaction(async () => {
        const organizationId = await createOrganization({
            name: input.organizationName,
            slug: input.organizationSlug,
        });

        const roleId = await getOwnerRoleId(organizationId);

        const passwordHash = await hashPassword(input.password);

        const userId = await createUser({
            ...input,
            passwordHash
        });

        await createProfile({
            userId,
            firstName: input.firstName,
            middleName: input.middleName,
            lastName: input.lastName,
            nameExtension: input.nameExtension
        });

        console.log('User registered successfully', { userId, organizationId, roleId });
    });
}
