import type { AuthenticatedUser } from './auth-user.type.js';

declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

export {};
