import { FromSchema } from 'json-schema-to-ts';

export const estimateSwapEvent = {
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
} as const;

export type EstimateSwapEvent = FromSchema<typeof estimateSwapEvent>;

export const estimateResponseSchema = {
    type: 'object',
    properties: {
        body: {
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
        },
    },
    required: ['body'],
} as const;

export type EstimateSwapResponse = FromSchema<typeof estimateResponseSchema>;

export const estimateSwapRoute = {
    path: '/estimate',
    method: 'GET',
};
