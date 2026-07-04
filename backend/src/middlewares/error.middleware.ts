import type { NextFunction, Request, Response } from 'express';

import { AppError } from '#shared/errors/app-error.js';
import { logger } from '#shared/logger/logger.js';


export function errorMiddleware(
    error: Error,
    _request: Request,
    response: Response,
    _next: NextFunction,
): void {

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