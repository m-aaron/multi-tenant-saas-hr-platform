import { AppError } from './app-error.js';


// This class represents a specific type of application error that indicates a forbidden action, such as insufficient permissions.
export class ForbiddenError extends AppError {

    constructor(message = 'Forbidden.') {
        super(message, 403);
    }
}