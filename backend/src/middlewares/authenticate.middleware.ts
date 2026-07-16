import { type RequestHandler } from 'express';
import type { PoolClient } from 'pg';

import { db } from '#database/index.js';

import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';

import { verifyAccessToken } from '#modules/auth/jwt.service.js';
import { findAuthenticatedUserById } from '#modules/auth/repositories/auth.repository.js';

import { USER_STATUS } from '#modules/user/constants/user.constant.js';


// This middleware function authenticates incoming requests by verifying the provided access token in the Authorization header.
export const authenticate: RequestHandler = async (req, _res, next) => {
    
    const client: PoolClient = await db.connect();
    const authHeader = req.headers.authorization;

    let token: string | undefined;

    if (typeof authHeader === 'string') {
        const [scheme, ...tokenParts] = authHeader.trim().split(/\s+/);

        if (scheme?.toLowerCase() === 'bearer' && tokenParts.length > 0) {
            token = tokenParts.join(' ');
        }
    }

    try {
        
        if (!token) {
            throw new UnauthorizedError('Authorization header is missing.');
        }   

        const payload = verifyAccessToken(token);

        const user = await findAuthenticatedUserById(client, payload.sub);

        if (!user) {
            throw new UnauthorizedError('User not found.');
        }

        if (user.organizationDeletedAt) {
            throw new UnauthorizedError('Organization has been deleted.');
        }

        if (user.status === USER_STATUS.INACTIVE) {
            throw new UnauthorizedError('User account is inactive.');
        }

        if (user.userDeletedAt) {
            throw new UnauthorizedError('User account has been deleted.');
        }

        req.user = {
            id: user.id,
            organizationId: user.organizationId,
            employeeId: user.employeeId,
            roleId: user.roleId,
            roleName: user.roleName,
            email: user.email,
            status: user.status
        };

        next();

    } finally{
        client.release();
    }
}