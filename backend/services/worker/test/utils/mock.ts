import { SwapDataDbDto } from '@cashmere-monorepo/backend-database';

// Mocked swap data db dto
export const mockedSwapDataDbDto = ({
    skipProcessing = false,
    swapContinueTxid,
}: {
    skipProcessing?: boolean;
    swapContinueTxid?: string;
} = {}): SwapDataDbDto => ({
    swapId: '0x000000000',
    chains: {
        srcChainId: 1,
        dstChainId: 2,
        srcL0ChainId: 3,
        dstL0ChainId: 4,
    },
    path: {
        lwsPoolId: 1,
        hgsPoolId: 2,
        hgsAmount: '0',
        dstToken: '0x000',
        minHgsAmount: '0',
    },
    user: {
        receiver: '0x',
        signature: '0x0',
    },
    status: {
        swapContinueTxid: swapContinueTxid,
    },
    progress: {},
    skipProcessing,
});
