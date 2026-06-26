import { type RequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '#shared/errors/app-error.js';
import type { ValidationConfig } from './validation.type.js';


export const validate = ( schema: ValidationConfig ): RequestHandler => async ( req, _res, next ) => {
    try {
        if (schema.body) {
            req.body = await schema.body.parseAsync(req.body);
        }

        if (schema.query) {
            req.query = await schema.query.parseAsync(req.query);
        }

        if (schema.params) {
            req.params = await schema.params.parseAsync(req.params);
        }

        next();
    } catch (error) {
        if (error instanceof ZodError) {
            next(new AppError('Validation failed', 400, 'VALIDATION_ERROR'));

            return;
        }

        next(error);
    }
};