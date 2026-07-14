import type { NextFunction, Request, Response } from 'express';

import { AppError } from '#shared/errors/app-error.js';
import { ValidationError } from '#shared/errors/validation-error.js';
import { logger } from '#shared/logger/logger.js';


// This middleware function handles errors that occur during request processing. 
// It checks the type of error and sends an appropriate response to the client, including status codes and error messages. 
// If the error is not recognized, it logs the error and sends a generic internal server error response.
export function errorMiddleware(
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
): void {

    if (error instanceof ValidationError) {
        response.status(error.statusCode).json({
            success: false,
            message: error.message,
            error: error.errors
        })
    }

    if (error instanceof AppError) {
        response.status(error.statusCode).json({
            success: false,
            message: error.message,
        });

        return;
    }

    logger.error(error);

    response.status(500).json({
        success: false,
        message: 'Internal server error.',
    });
}