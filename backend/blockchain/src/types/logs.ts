import { swapMessageReceivedEventABI } from '@cashmere-monorepo/shared-blockchain/abis';
import { Log } from 'viem';
import { MaybeAbiEventName } from 'viem/dist/types/types/contract';

/**
 * Type for the swap initiated log
 */
export type SwapInitiatedLogType = Log<
    bigint,
    number,
    typeof swapMessageReceivedEventABI,
    [typeof swapMessageReceivedEventABI],
    MaybeAbiEventName<typeof swapMessageReceivedEventABI>
>;
