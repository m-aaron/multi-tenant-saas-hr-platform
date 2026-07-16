import { withTransaction } from '#databases/transaction.js';

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

import { OWNER_EMPLOYEE_DEFAULTS } from '#modules/employee/constants/employee.contant.js';

import { hashPassword, verifyPassword } from '#shared/utils/password.util.js';
import { today } from '#shared/utils/date.util.js';
import { generateUuid } from '#shared/utils/uuid.util.js';
import { generateEmployeeNumber } from '#modules/employee/services/employee-number.service.js';
import { verifyRefreshToken } from './jwt.service.js';
import { compareRefreshTokenHash } from '../utils/auth.util.js';

import { ConflictError } from '#shared/errors/conflict-error.js';
import { NotFoundError } from '#shared/errors/not-found-error.js';
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

        if (!organizationId) {
            throw new ConflictError('Organization slug or email already exists.')
        }

        await seedDefaultRoles(client, organizationId);

        const ownerRoleId = await findRoleByName(client, organizationId, OWNER_EMPLOYEE_DEFAULTS.jobTitle);

        if (!ownerRoleId) {
            throw new NotFoundError('Owner role not found.');
        }

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

        const session = await findSessionById(client, payload.sid);

        if (!session) {
            throw new UnauthorizedError('Invalid or expired refresh token.');
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
            throw new UnauthorizedError('Invalid or expired refresh token.');
        }

        if (expiresAt < new Date()) {
            throw new UnauthorizedError('Invalid or expired refresh token.');
        }

        const refreshTokenMatches = await compareRefreshTokenHash(refreshTokenHash, refreshToken);

        if (!refreshTokenMatches) {
            throw new UnauthorizedError('Invalid or expired refresh token.');
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

        const session = await findSessionById(client, payload.sid);

        if (!session) {
            throw new UnauthorizedError('Invalid or expired refresh token.');
        }

        if (session.revokedAt) {
            throw new UnauthorizedError('Invalid or expired refresh token.');
        }

        if (session.expiresAt < new Date()) {
            throw new UnauthorizedError('Invalid or expired refresh token.');
        }

        await revokeSession(client, session.id);

    });
}


// This service function handles the logout of a user from all active sessions.
export async function logoutAllSessions(userId: string | undefined): Promise<void> {
    
    await withTransaction(async (client) => {
    
        await revokeAllSessions(client, userId);
    });
}