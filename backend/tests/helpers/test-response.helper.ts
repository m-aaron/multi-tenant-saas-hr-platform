import { expect } from 'vitest';
import type { Response } from 'supertest';

/**
 * Asserts that an HTTP response represents a successful operation.
 * Checks the status code, content-type header, and response.body.success === true.
 */
export function expectSuccessResponse(
    response: Response,
    expectedStatus = 200,
): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body.success).toBe(true);
}

/**
 * Asserts that an HTTP response represents a successful operation with data === null.
 */
export function expectNullDataSuccessResponse(
    response: Response,
    expectedStatus = 200,
): void {
    expectSuccessResponse(response, expectedStatus);
    expect(response.body.data).toBeNull();
}

/**
 * Asserts that an HTTP response represents an error response.
 * Checks status code, success === false, and optionally asserts the error message.
 */
export function expectErrorResponse(
    response: Response,
    expectedStatus: number,
    expectedMessage?: string | RegExp,
): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);

    if (expectedMessage !== undefined) {
        if (typeof expectedMessage === 'string') {
            expect(response.body.message).toBe(expectedMessage);
        } else {
            expect(response.body.message).toMatch(expectedMessage);
        }
    }
}

/**
 * Asserts a 400 Bad Request validation error response.
 */
export function expectValidationErrorResponse(
    response: Response,
    expectedMessage?: string | RegExp,
): void {
    expectErrorResponse(response, 400, expectedMessage);
}

/**
 * Asserts a 401 Unauthorized credential/token error response.
 */
export function expectUnauthorizedResponse(
    response: Response,
    expectedMessage?: string | RegExp,
): void {
    expectErrorResponse(response, 401, expectedMessage);
}

/**
 * Asserts a 403 Forbidden error response.
 */
export function expectForbiddenResponse(
    response: Response,
    expectedMessage?: string | RegExp,
): void {
    expectErrorResponse(response, 403, expectedMessage);
}

/**
 * Asserts a 409 Conflict error response.
 */
export function expectConflictResponse(
    response: Response,
    expectedMessage?: string | RegExp,
): void {
    expectErrorResponse(response, 409, expectedMessage);
}
