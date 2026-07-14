import { AppError } from './app-error.js';
import type { FieldValidationError } from '../types/validation-error.type.js'


// This class represents a specific type of application error that indicates a validation failure,
// such as when input data does not meet the required criteria.
export class ValidationError extends AppError {

    public readonly errors: FieldValidationError[];

    constructor(
        message = 'Validation failed.',
        errors: FieldValidationError[] = []
    ) {
        super(message, 400);

        this.errors = errors;
    }
}