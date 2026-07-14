import { AppError } from './app-error.js';


// This class represents a specific type of application error that indicates a conflict, such as a resource already existing.
export class ConflictError extends AppError {

    constructor(message = 'Conflict.') {
        super(message, 409);
    }
}