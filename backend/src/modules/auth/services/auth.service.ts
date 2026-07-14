import { withTransaction } from '#database/transaction.js';

import { 
    createOrganization, 
    seedDefaultRoles, 
    findRoleByName, 
    createEmployee,
    createUser,
    createProfile,
    findUserForLogin,
    revokeSession,
    revokeAllSessions
} from '#modules/auth/repositories/auth.repository.js';

import type { RegisterOrganizationInput } from '../schemas/registration.schema.js'
import type { LoginInput } from '../schemas/login.schema.js';

import type { LoginResult, TokenPair } from '../types/auth.type.js';

import { OWNER_EMPLOYEE_DEFAULTS } from '#modules/employee/constants/default.js';

import { hashPassword, verifyPassword } from '#shared/security/password.js';
import { today } from '#shared/utils/date.js';
import { generateUuid } from '#shared/utils/uuid.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { verifyRefreshToken } from '../jwt.service.js';
import { compareRefreshTokenHash } from '../utils/session.util.js';

import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';
import { ForbiddenError } from '#shared/errors/forbidden-error.js';

import { issueSession } from '#modules/session/services/session.service.js';
import { 
    createSession, 
    findSessionById,
    updateSessionRefreshToken
} from '#modules/session/repositories/session.repository.js';


// This service function handles the registration of a new organization along with its owner user and employee.
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


// This service function handles the login of a user and returns their user information along with access and refresh tokens.
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

        const sessionId = generateUuid();

        const session = await issueSession({
            sid: sessionId,
            sub: userId,
            organizationId: organizationId,
            roleId: roleId
        });

        await createSession(client, {
            id: sessionId,
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


// This service function handles the refreshing of an access token using a valid refresh token and returns a new pair of access and refresh tokens.
export async function refresh(refreshToken: string): Promise<TokenPair> {

    const result = await withTransaction(async (client) => {

        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            throw new UnauthorizedError('Invalid refresh token.');
        }

        const session = await findSessionById(client, payload.sid);

        if (!session) {
            throw new UnauthorizedError('Session not found.');
        }

        const { 
            id, 
            organizationId, 
            userId, 
            refreshTokenHash, 
            expiresAt, 
            revokedAt 
        } = session;

        if (revokedAt) {
            throw new UnauthorizedError('Session has been revoked.');
        }

        if (expiresAt < new Date()) {
            throw new UnauthorizedError('Session has expired.');
        }

        const refreshTokenMatches = await compareRefreshTokenHash(refreshTokenHash, refreshToken);

        if (!refreshTokenMatches) {
            throw new UnauthorizedError('Invalid refresh token.');
        }

        const updatedSession =  await issueSession({
            sid: id,
            sub: userId,
            organizationId: organizationId,
            roleId: payload.roleId
        });

        await updateSessionRefreshToken(client, {
            sessionId: id,
            refreshTokenHash: updatedSession.refreshTokenHash,
            expiresAt: updatedSession.expiresAt,
            lastUsedAt: new Date()
        });

        return updatedSession.tokens;
    });

    return result;
}


// This service function handles the logout of a user from a specific session.
export async function logout(refreshToken: string): Promise<void> {
    
    await withTransaction(async (client) => {
        
        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            throw new UnauthorizedError('Invalid refresh token.');
        }

        const session = await findSessionById(client, payload.sid);

        if (!session) {
            throw new UnauthorizedError('Session not found.');
        }

        if (session.revokedAt) {
            throw new UnauthorizedError('Session has been revoked.');
        }

        if (session.expiresAt < new Date()) {
            throw new UnauthorizedError('Session has expired.');
        }

        await revokeSession(client, session.id);

    });
}


// This service function handles the logout of a user from all active sessions.
export async function logoutAllSessions(refreshToken: string): Promise<void> {
    
    await withTransaction(async (client) => {
        
        const payload = verifyRefreshToken(refreshToken);

        if (!payload) {
            throw new UnauthorizedError('Invalid refresh token.');
        }

        await revokeAllSessions(client, payload.sub);
    });
}