import type { FieldValidationError } from './validation-error.type.js'

interface ApiResponse {
    success: boolean;
    message: string;
}

export interface ApiSuccessResponse <T> extends ApiResponse {
    data: T
}

export interface ApiErrorResponse extends ApiResponse {
    errors?: FieldValidationError[]
}