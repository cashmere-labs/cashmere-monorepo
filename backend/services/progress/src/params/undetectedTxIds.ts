import { logger } from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';

export type UndetectedTxIdsArgs = {
    txIds: string;
};

/**
 * Retrieves a list of transaction ids that are not yet detected in the SwapData.
 *
 * @param params An object containing the parameters for the function.
 * @returns A Promise that resolves to a list of undetected transaction ids.
 */
export async function getUndetectedTxIds(
    params: UndetectedTxIdsArgs
): Promise<string[]> {
    logger.debug({ params }, 'Getting undetected transaction ids');

    const txIdsArray = params.txIds.split(',');

    const swapDataRepository = await getSwapDataRepository();

    const processedTxIds =
        await swapDataRepository.getDiscoveredSwapInitiatedTxids(txIdsArray);

    return txIdsArray.filter((txid) => !processedTxIds.includes(txid));
}
