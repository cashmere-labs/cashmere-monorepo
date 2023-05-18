import { Address } from 'viem';
import { getAssetRepository } from './asset.repository';

type GetTokenMetadataArgs = {
    srcChainId: number;
    dstChainId: number;
    srcToken: Address;
    lwsToken: Address;
    hgsToken: Address;
    dstToken: Address;
};

export type SwapDataTokenMetadata = {
    srcDecimals: number;
    srcTokenSymbol: string;
    lwsTokenSymbol: string;
    hgsTokenSymbol: string;
    dstTokenSymbol: string;
};

export type ProgressRepository = {
    getTokenMetadata: (
        args: GetTokenMetadataArgs
    ) => Promise<SwapDataTokenMetadata>;
};

export const getProgressRepository = (): ProgressRepository => ({
    getTokenMetadata: async ({
        srcChainId,
        dstChainId,
        srcToken,
        lwsToken,
        hgsToken,
        dstToken,
    }) => {
        const srcAssetRepository = getAssetRepository(srcChainId);
        const dstAssetRepository = getAssetRepository(dstChainId);

        return {
            srcDecimals: await srcAssetRepository.tokenDecimal(srcToken),
            srcTokenSymbol: await srcAssetRepository.tokenSymbol(srcToken),
            lwsTokenSymbol: await srcAssetRepository.tokenSymbol(lwsToken),
            hgsTokenSymbol: await dstAssetRepository.tokenSymbol(hgsToken),
            dstTokenSymbol: await dstAssetRepository.tokenSymbol(dstToken),
        };
    },
});
