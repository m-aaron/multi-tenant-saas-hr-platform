import { AppError } from './app-error.js';


// This class represents a specific type of application error that indicates a resource was not found.
export class NotFoundError extends AppError {

    constructor(message = 'Resource not found.') {
        super(message, 404);
    }   
}