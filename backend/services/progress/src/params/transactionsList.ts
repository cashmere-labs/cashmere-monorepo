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
 * Get the transactions list
 * @param params
 * @param params.account
 * @param params.type
 * @param params.page
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
