import { HttpError } from './HttpError';
import { errorCodes } from './codes.constant';

/**
 * Error thrown when there's a conflict in input data
 */
export class ConflictError extends HttpError {
    constructor(readonly details?: string, readonly cause?: unknown) {
        super(409, errorCodes.request.conflict, 'conflict-error', {
            details,
            cause,
        });
    }
}
