import type { ErrorRequestHandler } from 'express';

import { AppError } from './app-error.js';

const errorHandler: ErrorRequestHandler = ( error, _req, res, _next ) => {
    if (error instanceof AppError) {
        return res.status(error.status).json({
            error: {
                message: error.message,
                code: error.code,
                status: error.status,
            },
        });
    }

    console.error(error);

    return res.status(500).json({
        error: {
            message: 'Internal Server Error',
            code: 'INTERNAL_SERVER_ERROR',
            status: 500
        },
    });
};

export default errorHandler;