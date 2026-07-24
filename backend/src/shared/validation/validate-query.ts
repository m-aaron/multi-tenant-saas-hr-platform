import type { RequestHandler } from 'express';

import { ZodError, type ZodType } from 'zod';

import { ValidationError } from '#shared/errors/validation-error.js';

export function validateQuery(schema: ZodType): RequestHandler {
    return (request, _response, next) => {
        try {
            const validatedQuery = schema.parse(request.query);
            Object.assign(request.query, validatedQuery);

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const validationIssues = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));

                next(new ValidationError('Validation failed.', validationIssues));

                return;
            }

            next(error);
        }
    };
}
