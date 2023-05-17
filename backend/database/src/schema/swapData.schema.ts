import { Schema } from 'mongoose';

/**
 * Define the swap data schema
 */
export const SwapDataSchema = new Schema({
    swapId: { type: String, index: true },

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
        swapInitiatedTimestamp: { type: Date },
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
SwapDataSchema.index({ swapId: 1, srcChainId: 1 }, { unique: true });
