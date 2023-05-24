// transactionsListDelete.ts
import { logger } from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { getAddress } from 'viem';

// TransactionsListDelete args
export type TransactionsListDeleteArgs = {
    account: string;
};

/**
 * Delete all transactions for a specific account
 * @param params
 * @param params.account
 */
export async function deleteTransactionsList(
    params: TransactionsListDeleteArgs
): Promise<{ message: string }> {
    logger.debug({ params }, 'Deleting transactions list');

    // Extract and format our params
    const { account } = params;
    const receiver = getAddress(account);

    // Get our swap data repository
    const swapDataRepository = await getSwapDataRepository();

    // Hide all the swap data for our user
    await swapDataRepository.hideAllSwapIds(receiver);

    // Return success message
    return { message: 'Transactions List deleted successfully.' };
}
