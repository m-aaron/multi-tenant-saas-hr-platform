import type { RequestHandler } from 'express';

import { type RoleName } from '#modules/role/constants/role.constant.js';

import { UnauthorizedError } from '#shared/errors/unauthorized-error.js';
import { ForbiddenError } from '#shared/errors/forbidden-error.js';


export function requireRole(...requiredRoles: RoleName[]): RequestHandler {
    
    return (req, _res, next) => {
        
        const user = req.user;

        if (!user) {
            throw new UnauthorizedError('User not authenticated');
        }    

        const userRole = user.roleName;

        if (!userRole || !requiredRoles.includes(userRole as RoleName)) {
            throw new ForbiddenError('You do not have permission to perform this action.');
        }

        next();
    }
}