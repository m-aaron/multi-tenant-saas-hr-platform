import { withTransaction } from '#database/transaction.js';
import { 
    createOrganization, 
    seedDefaultRoles, 
    findRoleByName, 
    createEmployee 
} from '#modules/auth/repositories/auth.repository.js';
import type { RegisterOrganizationInput } from '../types/auth.type.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { 
    OWNER_EMPLOYEE_DEFAULTS
} from '#modules/employee/constants/default.js';


export async function registerOrganization(input: RegisterOrganizationInput): Promise<void> {
    
    await withTransaction(async (client) => {

        const organizationId = await createOrganization(client, {
            name: input.organizationName,
            slug: input.organizationSlug,
        });

        await seedDefaultRoles(client, organizationId);
        await findRoleByName(client, organizationId, OWNER_EMPLOYEE_DEFAULTS.jobTitle);

        const employeeNumber = await generateEmployeeNumber(client, organizationId);

        await createEmployee(client, {
            organizationId,
            employeeNumber,
            firstName: input.firstName,
            middleName: input.middleName,
            lastName: input.lastName,
            nameExtension: input.nameExtension,
            jobTitle: OWNER_EMPLOYEE_DEFAULTS.jobTitle,
            employmentStatus: OWNER_EMPLOYEE_DEFAULTS.employmentStatus,
            hireDate: new Date().toISOString().slice(0, 10) // Format as YYYY-MM-DD
        });

    });
}