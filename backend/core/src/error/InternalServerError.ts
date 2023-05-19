import { HttpError } from './HttpError';
import { errorCodes } from './codes.constant';

/**
 * Error thrown when the input arguments arn't valid
 */
export class InternalServerError extends HttpError {
    constructor(readonly details?: string, readonly cause?: unknown) {
        super(500, errorCodes.server.internal, 'internal-server-error', {
            details,
            cause,
        });
    }
}
