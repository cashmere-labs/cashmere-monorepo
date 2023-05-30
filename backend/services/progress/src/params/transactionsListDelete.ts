// transactionsListDelete.ts
import { logger } from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { getAddress } from 'viem';

// TransactionsListDelete args
export type TransactionsListDeleteArgs = {
    account: string;
};

/**
 * Hides all transactions related to the specified account.
 *
 * @param params An object containing the parameters for the function.
 * @returns A Promise that resolves to a success message.
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
