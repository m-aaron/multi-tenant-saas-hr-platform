import { withTransaction } from '#database/transaction.js';
import { 
    createOrganization, 
    seedDefaultRoles, 
    findRoleByName, 
    createEmployee,
    createUser,
    createProfile
} from '#modules/auth/repositories/auth.repository.js';
import type { RegisterOrganizationInput } from '../types/auth.type.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { 
    OWNER_EMPLOYEE_DEFAULTS
} from '#modules/employee/constants/default.js';
import { hashPassword } from '#shared/security/password.js';
import { today } from '#shared/utils/date.js';


export async function registerOrganization(input: RegisterOrganizationInput): Promise<void> {
    
    await withTransaction(async (client) => {

        const organizationId = await createOrganization(client, {
            name: input.organizationName,
            slug: input.organizationSlug,
        });

        await seedDefaultRoles(client, organizationId);

        const ownerRoleId = await findRoleByName(client, organizationId, OWNER_EMPLOYEE_DEFAULTS.jobTitle);
        const employeeNumber = await generateEmployeeNumber(client, organizationId);

        const employeeId = await createEmployee(client, {
            organizationId,
            employeeNumber,
            firstName: input.firstName,
            middleName: input.middleName,
            lastName: input.lastName,
            nameExtension: input.nameExtension,
            jobTitle: OWNER_EMPLOYEE_DEFAULTS.jobTitle,
            employmentStatus: OWNER_EMPLOYEE_DEFAULTS.employmentStatus,
            hireDate: today()
        });

        const passwordHash = await hashPassword(input.password);

        const userId = await createUser(client, {
            employeeId,
            organizationId,
            roleId: ownerRoleId,
            email: input.ownerEmail,
            passwordHash
        });

        await createProfile(client, {
            userId
        });

    });
}