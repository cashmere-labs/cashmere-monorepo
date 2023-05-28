import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { logger } from '@cashmere-monorepo/backend-core';
import { getLastBlockRepository } from '@cashmere-monorepo/backend-database/src/repositories/lastBlock.repository';
import { buildBridgeBlockScanner } from './bridgeBlockScanner';

/**
 * Build the bridge repository for the given chain
 * @param chainId
 */
export const buildBridgeService = async (chainId: number) => {
    // Fetch some repo we will use every where
    const lastBlockRepository = await getLastBlockRepository();
    const blockchainRepository = await getBlockchainRepository(chainId);

    // Get our bridge block scanner
    const blockScanner = await buildBridgeBlockScanner(chainId);

    /**
     * Check all the pending tx status for this chain
     * TODO: Port the logic
     */
    const checkAllTxStatus = async () => {
        logger.debug({ chainId }, 'Cheching all the pending tx status');
    };

    /**
     * Process our bridge event's on the given chain
     */
    const processBridgeOnChain = async () => {
        // TODO: Execution mutex for this chain with dynamo db

        // Get the latest block explored for the given chain
        const lastBlockIterated = await lastBlockRepository.getForChainAndType(
            chainId,
            'bridge'
        );

        // Get the latest blockchain block
        const targetBlock = await blockchainRepository.getLastBlock();

        // If we don't have a last block iterated, we start from the last block
        if (!lastBlockIterated) {
            logger.info(
                { chainId, targetBlock },
                `No last block iterated, starting from the last block`
            );
            await lastBlockRepository.updateForChainAndType(
                chainId,
                'bridge',
                Number(targetBlock)
            );
            return;
        }

        // Our start block for the handling
        let startBlock = BigInt(lastBlockIterated);

        // While we have blocks to handle
        while (startBlock < targetBlock) {
            // Wait to handle all the new blocks on this chain
            const blockHandlingResult = await blockScanner.handleNewBlock({
                from: startBlock,
                to: targetBlock,
            });
            logger.debug(
                { chainId, startBlock, targetBlock, blockHandlingResult },
                `Finished to handle new block's for potential bridge trigger`
            );
            // Once we have handled all the blocks, we can update the last block iterated
            await lastBlockRepository.updateForChainAndType(
                chainId,
                'bridge',
                Number(blockHandlingResult.lastBlockHandled)
            );
            // Update the start block
            startBlock = blockHandlingResult.lastBlockHandled;
            // Wait for 500ms before the next trigger
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Once we iterated over every pending blocks, check all the tx status
        await checkAllTxStatus();

        logger.info(
            { chainId, lastBlockIterated, targetBlock },
            `Handled all the blocks range for potential bridge event's`
        );
    };

    // Return our process bridge function
    return { processBridgeOnChain };
};
