import { withTransaction } from '#database/transaction.js';

import { 
    createOrganization, 
    seedDefaultRoles, 
    findRoleByName, 
    createEmployee,
    createUser,
    createProfile,
    findUserForLogin
} from '#modules/auth/repositories/auth.repository.js';

import type { JwtPayload } from '../types/auth.type.js';

import type { RegisterOrganizationInput } from '../schemas/auth.schema.js'
import type { LoginInput } from '../schemas/login.schema.js';

import type { LoginResult } from '../types/auth.type.js';

import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';

import { OWNER_EMPLOYEE_DEFAULTS } from '#modules/employee/constants/default.js';

import { hashPassword, verifyPassword } from '#shared/security/password.js';
import { today } from '#shared/utils/date.js';

import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';
import { ForbiddenError } from '#shared/errors/forbidden-error.js';

import { issueSession } from '#modules/session/services/session.service.js';
import { createSession } from '#modules/session/repositories/session.repository.js';


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


export async function login(input: LoginInput): Promise<LoginResult> {

    const result = await withTransaction(async (client) => {

        const user = await findUserForLogin(client, 
            { 
                organizationSlug: input.organizationSlug, 
                email: input.email
            }
        );

        if (!user) {
            throw new UnauthorizedError('Invalid credentials.');
        }

        const userId = user.id;
        const employeeId = user.employeeId;
        const organizationId = user.organizationId;
        const roleId = user.roleId;
        const email = user.email;
        const passwordHash = user.passwordHash;
        const userStatus = user.status;

        const isPasswordValid = await verifyPassword(passwordHash, input.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid credentials.');
        }

        if (userStatus !== 'active') {
            throw new ForbiddenError('User account is not active.');
        }

        const payload: JwtPayload = {
            sub: userId,
            organizationId: organizationId,
            roleId: roleId
        }

        const session = await issueSession(payload);

        await createSession(client, {
            organizationId,
            userId,
            refreshTokenHash: session.refreshTokenHash,
            expiresAt: session.expiresAt
        });

        return {
            user: {
                id: userId,
                organizationId,
                employeeId,
                roleId,
                email
            },
            tokens: session.tokens
        };
    });

    return result;
}