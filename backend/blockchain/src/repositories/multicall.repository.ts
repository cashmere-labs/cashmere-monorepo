import { logger } from '@cashmere-monorepo/backend-core/logger/logger';
import {
    findTransport,
    getNetworkConfigAndClient,
} from '@cashmere-monorepo/shared-blockchain';
import { sleep } from 'radash';
import { Config } from 'sst/node/config';
import { Address, Hex, createWalletClient, multicall3Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { GasParam } from '../types';

/**
 * Get the multi call repository on the given chain
 * @param chainId
 */
export const getMultiCallRepository = (chainId: number) => {
    // Get the config and client
    const { config, client } = getNetworkConfigAndClient(chainId);

    // Get the write client
    const account = privateKeyToAccount(Config.PRIVATE_KEY as Hex);

    // And finally get the client
    const privateClient = createWalletClient({
        account,
        chain: client.chain,
        transport: findTransport(config.rpcUrl),
    });

    // Get our multicall address
    const multicallAddress = config.chain.contracts?.multicall3?.address;

    // If not found, exit directly
    if (!multicallAddress) {
        throw new Error(
            `Unable to build multi call repository for chain ${chainId}, no multicall3 address founded`
        );
    }

    /**
     * Get our function ca
     * @param callData
     * @param gasParam
     * @param allowFailure
     * @return The index of all the tx sent from the initial array
     */
    const sendBatchedTx = async (
        callData: MultiCallFunctionData[],
        gasParam: GasParam,
        allowFailure: boolean = false
    ): Promise<{
        txHash: string;
        successIdx: number[];
        failedIdx: number[];
    }> => {
        // Build the call data's
        let callValues = callData.map((data) => ({
            target: data.target,
            callData: data.data,
            value: 0n,
            allowFailure,
        }));

        // Try to simulate the request

        // TODO: Try catch with fallback mecanism, like simulating each tx one by one and checking which one failed
        // TODO: Binary search to identify the failing tx?
        const { request } = await client.simulateContract({
            account,
            address: multicallAddress,
            abi: [multicall3Abi],
            functionName: 'aggregate3',
            args: [callValues],
            // Put the additional gas param
            ...gasParam,
        });

        // Perform the gas estimation, and ensure it won't exceed max wei / tx
        const gasEstimation = await client.estimateGas(request);

        // If this call exceed the number of limit, try again with fewer tx (take only 95% of the given tx)
        if (gasEstimation > gasParam.gasLimit) {
            logger.info(
                { chainId, callData, gasParam, nbrOfTx: callValues.length },
                'Too much operation to be performed on a single tx, reducing number of tx'
            );
            // Take 95% of the callData
            const reducedCallData = callData.slice(
                0,
                Math.floor((callData.length * 95) / 100)
            );
            if (reducedCallData.length === 0) {
                throw new Error(
                    `Unable to execute the tx from the given list, a tx has probably an infinite gas usage`
                );
            }
            // Wait for 50ms to prevent rpc provider flooding
            await sleep(50);
            // Send back the batched tx with the reduced number of call data
            return await sendBatchedTx(reducedCallData, gasParam, allowFailure);
        }

        // If we are all good, execute the tx
        logger.info(
            {
                chainId,
                callData,
                gasParam,
                nbrOfTx: callValues.length,
            },
            'Executing new batched TX'
        );
        const txHash = await privateClient.writeContract(request);

        // Return all the index of the item picked
        const successIdx = callData.map((_, index) => index);
        return {
            txHash,
            successIdx,
            // TODO: No failed tx possible yet, since we don't perform try catch mecanism
            failedIdx: [],
        };
    };

    return {
        sendBatchedTx,
    };
};

export type MultiCallFunctionData = {
    readonly target: Address;
    readonly data: Hex;
};
