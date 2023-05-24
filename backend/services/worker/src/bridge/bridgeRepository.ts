import { getBlockchainRepository } from '@cashmere-monorepo/backend-blockchain/src/repositories/blockchain.repository';
import { logger } from '@cashmere-monorepo/backend-core';
import { getLastBlockRepository } from '@cashmere-monorepo/backend-database/src/repositories/lastBlock.repository';

/**
 * Process our bridge function on the given chain
 * @param chainId The chain id to process
 */
export const processBridgeOnChain = async (chainId: number) => {
    // TODO: Execution mutex for this chain with dynamo db

    const lastBlockRepository = await getLastBlockRepository();
    const blockchainRepository = await getBlockchainRepository(chainId);

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

    // Wait to handle all the new blocks on this chain
    await handleNewBlock(chainId, {
        from: BigInt(lastBlockIterated),
        to: targetBlock,
    });

    // Once we have handled all the blocks, we can update the last block iterated
    await lastBlockRepository.updateForChainAndType(
        chainId,
        'bridge',
        Number(targetBlock)
    );
};

/**
 * Handle new block's on the given chain
 * @param chainId The chain id to handle
 * @param blockRange The block range to handle
 */
const handleNewBlock = async (
    chainId: number,
    blockRange: { from: bigint; to: bigint }
) => {
    logger.debug({ chainId, blockRange }, `Handling new blocks`);

    // TODO: Port all the logic
};
