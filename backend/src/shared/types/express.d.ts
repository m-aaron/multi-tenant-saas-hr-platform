import type { AuthUser } from './auth-user.type.js';

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export {};
