import { HydratedDocument, Schema } from 'mongoose';
import { Address, Hash, Hex } from 'viem';

// Swap data interface
export interface SwapData {
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

/**
 * Define the swap data schema
 */
export const SwapDataSchema = new Schema<SwapData>({
    swapId: { type: String, required: true, index: true },

    // Chain's infos
    chains: {
        srcChainId: { type: Number, required: true, index: true },
        dstChainId: { type: Number, required: true, index: true },
        srcL0ChainId: { type: Number, required: true },
        dstL0ChainId: { type: Number, required: true },
    },

    // Swap path
    path: {
        lwsPoolId: { type: Number, required: true },
        hgsPoolId: { type: Number, required: true },
        hgsAmount: { type: String, required: true },
        dstToken: { type: String, required: true },
        minHgsAmount: { type: String, required: true },
        fee: { type: String, required: false },
    },

    // User data
    user: {
        receiver: { type: String, required: true, index: true },
        signature: { type: String, required: true },
    },

    // Status data
    status: {
        swapInitiatedTimestamp: { type: Number },
        swapInitiatedTxid: { type: String },
        l0Link: { type: String },
        swapPerformedTxid: { type: String },
        swapContinueTxid: { type: String },
        swapContinueConfirmed: { type: Boolean },
        progressHidden: { type: Boolean },
    },

    // Progress data
    progress: {
        srcAmount: { type: String },
        srcToken: { type: String },
        srcDecimals: { type: Number },
        srcTokenSymbol: { type: String },
        lwsTokenSymbol: { type: String },
        hgsTokenSymbol: { type: String },
        dstTokenSymbol: { type: String },
    },

    skipProcessing: { type: Boolean },
});

// Add unique index on swap id and src chain id
SwapDataSchema.index({ swapId: 1, 'chains.srcChainId': 1 }, { unique: true });

// The type for our swap data document
export type SwapDataDocument = HydratedDocument<SwapData>;
