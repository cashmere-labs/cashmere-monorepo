import { HttpError } from './HttpError';
import { errorCodes } from './codes.constant';

/**
 * Error thrown when authorization has failed
 */
export class UnauthorizedError extends HttpError {
    constructor(readonly details?: string, readonly cause?: unknown) {
        super(401, errorCodes.request.unauthorized, 'unauthorized-error', {
            details,
            cause,
        });
    }
}
