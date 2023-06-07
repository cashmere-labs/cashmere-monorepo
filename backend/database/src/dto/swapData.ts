import { Address, Hash, Hex } from 'viem';

// Swap data interface
export interface SwapDataDbDto {
    swapId: Hex;

    // Chains info
    chains: {
        srcChainId: number;
        dstChainId: number;
        srcL0ChainId: number;
        dstL0ChainId: number;
    };

    // Swap path
    path: {
        lwsPoolId: number;
        hgsPoolId: number;
        hgsAmount: string;
        dstToken: Address;
        minHgsAmount: string;
        fee?: string;
    };

    // User data
    user: {
        receiver: Address;
        signature: Hex;
    };

    // Status data
    status: {
        swapInitiatedTimestamp?: number;
        swapInitiatedTxid?: Hash;
        l0Link?: string;
        swapPerformedTxid?: Hash;
        swapContinueTxid?: Hash;
        swapContinueConfirmed?: boolean;
        progressHidden?: boolean;
    };

    // Progress data
    progress: {
        srcAmount?: string;
        srcToken?: Address;
        srcDecimals?: number;
        srcTokenSymbol?: string;
        lwsTokenSymbol?: string;
        hgsTokenSymbol?: string;
        dstTokenSymbol?: string;
    };

    skipProcessing?: boolean;
}
