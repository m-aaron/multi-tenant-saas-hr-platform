import { withTransaction } from '#database/transaction.js';
import { createOrganization, seedDefaultRoles, findRoleByName } from '#modules/auth/repositories/auth.repository.js';
import type { RegisterOrganizationInput } from '../types/auth.type.js';


export async function registerOrganization(input: RegisterOrganizationInput): Promise<void> {
    
    await withTransaction(async (client) => {

        const organizationId = await createOrganization(client, {
            name: input.organizationName,
            slug: input.organizationSlug,
        });

        await seedDefaultRoles(client, organizationId);

        const ownerRoleId = await findRoleByName(client, organizationId, 'Owner');

        console.log(`Organization created with ID: ${organizationId}`);
        console.log(`Owner role ID: ${ownerRoleId}`);

    });
}