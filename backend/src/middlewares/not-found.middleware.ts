import type { NextFunction, Request, Response } from 'express';

import { NotFoundError } from '#shared/errors/not-found-error.js';
import { logger } from '#shared/logger/logger.js';


// This middleware function handles requests to routes that do not exist.
export function notFoundMiddleware(
    _request: Request, 
    _response: Response, 
    next: NextFunction
): void {
    
    logger.warn('Resource not found.');

    return next(new NotFoundError('Route not found.'));
}