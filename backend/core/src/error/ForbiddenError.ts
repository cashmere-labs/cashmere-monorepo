import { HttpError } from './HttpError';
import { errorCodes } from './codes.constant';

/**
 * Error thrown when access to a resource is denied
 */
export class ForbiddenError extends HttpError {
    constructor(readonly details?: string, readonly cause?: unknown) {
        super(403, errorCodes.request.forbidden, 'forbidden-error', {
            details,
            cause,
        });
    }
}
