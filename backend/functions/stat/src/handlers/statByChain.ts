import {
    ContractFunctionHandler,
    InvalidArgumentsError,
} from '@cashmere-monorepo/backend-core';
import { getStatRepository } from '@cashmere-monorepo/backend-database';
import { statByChainContract } from '@cashmere-monorepo/shared-contract-stat-params';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(statByChainContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    const statDataRepository = await getStatRepository();

    const chainId = event.queryStringParameters.chainId;

    if (!chainId || isNaN(parseInt(chainId, 10))) {
        throw new InvalidArgumentsError('chain id should be a number');
    }

    const stats = await statDataRepository.getByChainId(1);
    return {
        statusCode: 200,
        body: {
            status: 'OK',
            stats: stats || {},
        },
    };
});