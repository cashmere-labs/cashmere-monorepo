export const createHttpError = (message: string, statusCode = 400) => {
    const error = new Error(message);
    error['statusCode'] = statusCode;
    return error;
};
