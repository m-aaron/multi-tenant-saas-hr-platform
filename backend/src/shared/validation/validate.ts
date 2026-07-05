import type { RequestHandler } from 'express';

import { ZodError, type ZodType } from 'zod';

import { ValidationError } from '#shared/errors/validation-error.js';

export function validate(schema: ZodType): RequestHandler {
    return (request, _response, next) => {
        try {
            request.body = schema.parse(request.body);

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                throw new ValidationError(error.issues[0]?.message ?? 'Validation failed.');
            }

            next(error);
        }
    };
}