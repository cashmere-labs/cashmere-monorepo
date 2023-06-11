/**
 * Generic type for a range of blocks
 */
export type BlockRange = {
    fromBlock: bigint;
    toBlock: bigint;
};

/**
 * Generic type for the current gas params
 */
export type GasParam =
    | { gasLimit: bigint; maxPriorityFeePerGas: bigint; maxFeePerGas: bigint }
    | { gasLimit: bigint; gasPrice?: bigint };
