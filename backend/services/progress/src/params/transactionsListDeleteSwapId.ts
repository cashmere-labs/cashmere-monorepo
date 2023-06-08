import { logger } from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
import { Hex, getAddress, isAddressEqual } from 'viem';

export type TransactionsListDeleteSwapIdArgs = {
    account: string;
    swapId: Hex;
};

/**
 * Hides a specific transaction identified by swapId related to the specified account.
 *
 * @param params An object containing the parameters for the function.
 * @returns A Promise that resolves to a success message.
 */
export async function deleteTransactionsListBySwapId(
    params: TransactionsListDeleteSwapIdArgs
): Promise<{ message: string }> {
    logger.debug({ params }, 'Deleting transaction by Swap ID');

    const { account, swapId } = params;
    const receiver = getAddress(account);

    const swapDataRepository = await getSwapDataRepository();
    const swapData = await swapDataRepository.get(swapId);

    if (
        !swapId ||
        !swapData ||
        !isAddressEqual(swapData.user.receiver, receiver) ||
        !swapData.status.swapContinueConfirmed
    ) {
        throw new Error('Invalid swap ID');
    }

    swapData.status.progressHidden = true;
    await swapDataRepository.update(swapData, ['status.progressHidden']);

    return { message: 'Transaction deleted successfully.' };
}
