export const estimateQueryStringParametersSchema = {
    type: 'object',
    properties: {
        queryStringParameters: {
            type: 'object',
            properties: {
                srcChainId: { type: 'string' },
                dstChainId: { type: 'string' },
                amount: { type: 'string' },
                srcToken: { type: 'string' },
                dstToken: { type: 'string' },
            },
            required: [
                'srcChainId',
                'dstChainId',
                'amount',
                'srcToken',
                'dstToken',
            ],
            additionalProperties: false,
        },
    },
    required: ['queryStringParameters'],
    additionalProperties: false,
} as const;

export const estimateResponseSchema = {
    type: 'object',
    properties: {
        dstAmount: { type: 'string' },
        minReceivedDst: { type: 'string' },
        fee: { type: 'string' },
        priceImpact: { type: 'string' },
        nativeFee: { type: 'string' },
    },
    required: [
        'dstAmount',
        'minReceivedDst',
        'fee',
        'priceImpact',
        'nativeFee',
    ],
    additionalProperties: false,
} as const;

export const estimateSwapRoute = {
    path: '/estimate',
    method: 'GET',
};
