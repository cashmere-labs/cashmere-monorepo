import { ContractFunctionHandler } from '@cashmere-monorepo/backend-core';
import { listSwapContract } from '@cashmere-monorepo/shared-contract-stat';
import { listSwaps } from '../params/listSwaps';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(listSwapContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    return listSwaps(event.queryStringParameters);
});
