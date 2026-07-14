import { AppError } from './app-error.js';


// This class represents a specific type of application error that indicates an unauthorized action, 
// such as invalid credentials or lack of authentication.
export class UnauthorizedError extends AppError {

    constructor(message = 'Unauthorized.') {
        super(message, 401);
    }
}