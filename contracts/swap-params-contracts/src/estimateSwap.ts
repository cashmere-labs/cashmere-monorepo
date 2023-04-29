import {
  ApiGatewayContract,
  HttpStatusCodes,
} from '@swarmion/serverless-contracts';

const queryStringParametersSchema = {
  type: 'object',
  properties: {
    srcChainId: { type: 'string' },
    dstChainId: { type: 'string' },
    amount: { type: 'string' },
    srcToken: { type: 'string' },
    dstToken: { type: 'string' },
  },
  required: ['srcChainId', 'dstChainId', 'amount', 'srcToken', 'dstToken'],
  additionalProperties: false,
} as const;

const estimateResponseSchema = {
  type: 'object',
  properties: {
    dstAmount: { type: 'string' },
    minReceivedDst: { type: 'string' },
    fee: { type: 'string' },
    priceImpact: { type: 'string' },
    nativeFee: { type: 'string' },
  },
  required: ['dstAmount', 'minReceivedDst', 'fee', 'priceImpact', 'nativeFee'],
  additionalProperties: false,
} as const;

const errorResponseSchema = {
  type: 'string',
  additionalProperties: false,
} as const;

const estimateSwapContract = new ApiGatewayContract({
  id: 'swap-params-estimate',
  path: '/estimate',
  method: 'GET',
  integrationType: 'httpApi',
  queryStringParametersSchema: queryStringParametersSchema,
  outputSchemas: {
    [HttpStatusCodes.OK]: estimateResponseSchema,
    [HttpStatusCodes.INTERNAL_SERVER_ERROR]: errorResponseSchema,
  },
});

export default estimateSwapContract;
