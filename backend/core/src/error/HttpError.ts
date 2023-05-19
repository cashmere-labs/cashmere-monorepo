/**
 * Custom http error used at the API level
 */
export class HttpError extends Error {
    constructor(
        // Status code for the error response
        readonly statusCode: number,
        // Custom error code
        readonly errorCode: string,
        // Description of the error
        readonly message: string,
        // Custom option's for better logging
        readonly options?: {
            details?: string;
            cause?: unknown;
        }
    ) {
        super(`${errorCode}: ${message}`, options);
    }
}
