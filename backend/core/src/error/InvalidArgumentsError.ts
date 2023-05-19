import { errorCodes } from './codes.constant';
import { HttpError } from './HttpError';

/**
 * Error thrown when the input arguments arn't valid
 */
export class InvalidArgumentsError extends HttpError {
    constructor(readonly details?: string, readonly cause?: unknown) {
        super(400, errorCodes.request['invalid-args'], 'invalid-arguments', {
            details,
            cause,
        });
    }
}
