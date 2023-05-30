import { logger } from '@cashmere-monorepo/backend-core';
import {
    SwapDataDbDto,
    getSwapDataRepository,
} from '@cashmere-monorepo/backend-database';
import { getAddress } from 'viem';

// TransactionsList args
export type TransactionsListArgs = {
    account: string;
    type?: 'complete';
    page?: number;
};

// TransactionsList response
export interface TransactionsListResponse {
    count: number;
    items: SwapDataDbDto[];
}

/**
 * Retrieves a list of transaction data for the specified account, type, and page.
 *
 * @param params An object containing the parameters for the function.
 * @returns A Promise that resolves to a list of transaction data.
 */
export async function getTransactionsList(
    params: TransactionsListArgs
): Promise<TransactionsListResponse> {
    logger.debug({ params }, 'Getting transactions list');

    // Extract and format our params
    const { account, type, page } = params;
    const receiver = getAddress(account);

    // Get our swap data repository
    const swapDataRepository = await getSwapDataRepository();

    // Get all the swap data for our user
    const swapData = await swapDataRepository.getByReceiver(
        receiver,
        {
            progressHidden: null,
            ...(type === 'complete' && { swapContinueConfirmed: true }),
        },
        type === 'complete' ? page : undefined
    );
    return swapData;
}
