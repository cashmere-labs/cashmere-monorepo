export type healthCheckType = {
    statusCode: number;
    body: {
        status: string;
        message: string;
        timestamp: string;
    };
};
