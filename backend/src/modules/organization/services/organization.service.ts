import { withTransaction } from "#databases/transaction.js";
import { ForbiddenError } from "#shared/errors/forbidden-error.js";
import { NotFoundError } from "#shared/errors/not-found-error.js";

import { 
    findOrganizationById,
    updateOrganizationById 
} from "../repositories/organization.repository.js";

import type { OrganizationRow } from "../types/organization.type.js";

import type { UpdateOrganizationInput } from "../schemas/organization.schema.js";


// This service function handles the current organization and returns their organization information.
export async function getCurrentOrganization(
    organizationId: string | undefined
): Promise<OrganizationRow> {

    const result = await withTransaction(async (client) => {

        const organization = await findOrganizationById(client, organizationId);

        if (!organization) {
            throw new NotFoundError('Organization not found.')
        }

        if (organization.revokedAt) {
            throw new ForbiddenError('Organization is not active.')
        }

        return {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            createdAt: organization.createdAt,
            updatedAt: organization.updatedAt
        };
    });

    return result;
}


// This service function handles the updating organization and returns their updated information.
export async function updateCurrentOrganization(
    input: UpdateOrganizationInput, 
    organizationId: string | undefined
): Promise<OrganizationRow> {

    const result = await withTransaction(async (client) => {

        const updatedOrganization = await updateOrganizationById(
            client, 
            input.organizationName,
            organizationId
        );

        if (!updatedOrganization) {
            throw new NotFoundError('Organization not found.')
        }

        if (updatedOrganization.revokedAt) {
            throw new ForbiddenError('Organization is not active.')
        }

        return {
            id: updatedOrganization.id,
            name: updatedOrganization.name,
            slug: updatedOrganization.slug,
            createdAt: updatedOrganization.createdAt,
            updatedAt: updatedOrganization.updatedAt
        };
    });

    return result;
}