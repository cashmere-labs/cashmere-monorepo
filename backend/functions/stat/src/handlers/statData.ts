import { ContractFunctionHandler } from '@cashmere-monorepo/backend-core';
import { getStatRepository } from '@cashmere-monorepo/backend-database';
import { statAllChainContract } from '@cashmere-monorepo/shared-contract-stat';

// Build our contract handler for the test contract
const contractHandler = ContractFunctionHandler(statAllChainContract);

// Export our handler
export const handler = contractHandler(async (event) => {
    const statDataRepository = await getStatRepository();
    const stats = await statDataRepository.getAll();
    return {
        statusCode: 200,
        body: {
            status: 'OK',
            stats: stats || [],
        },
    };
});
