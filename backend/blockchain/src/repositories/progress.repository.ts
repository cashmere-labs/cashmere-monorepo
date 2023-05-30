import { Address } from 'viem';
import { getAssetRepository } from './asset.repository';

// Tokens metadata request argument type
export type GetTokenMetadataArgs = {
    srcChainId: number;
    dstChainId: number;
    srcToken: Address;
    lwsToken: Address;
    hgsToken: Address;
    dstToken: Address;
};

// Tokens metadata return type
export type SwapDataTokenMetadata = {
    srcDecimals: number;
    srcTokenSymbol: string;
    lwsTokenSymbol: string;
    hgsTokenSymbol: string;
    dstTokenSymbol: string;
};

// Generic interface for progress repository
export type ProgressRepository = {
    getTokenMetadata: (
        args: GetTokenMetadataArgs
    ) => Promise<SwapDataTokenMetadata>;
};

/**
 * Get progress repository
 */
export const getProgressRepository = (): ProgressRepository => ({
    /**
     * Get src token decimals and src, lws, hgs, dst token symbols
     * for given srcToken, lwsToken, hgsToken, dstToken on given src and dst chains
     * @param srcChainId
     * @param dstChainId
     * @param srcToken
     * @param lwsToken
     * @param hgsToken
     * @param dstToken
     */
    getTokenMetadata: async ({
        srcChainId,
        dstChainId,
        srcToken,
        lwsToken,
        hgsToken,
        dstToken,
    }) => {
        // Get asset repositories for src and dst chains
        const srcAssetRepository = getAssetRepository(srcChainId);
        const dstAssetRepository = getAssetRepository(dstChainId);

        // Get and return src token decimals and src, lws, hgs, dst token symbols
        return {
            srcDecimals: await srcAssetRepository.tokenDecimal(srcToken),
            srcTokenSymbol: await srcAssetRepository.tokenSymbol(srcToken),
            lwsTokenSymbol: await srcAssetRepository.tokenSymbol(lwsToken),
            hgsTokenSymbol: await dstAssetRepository.tokenSymbol(hgsToken),
            dstTokenSymbol: await dstAssetRepository.tokenSymbol(dstToken),
        };
    },
});
