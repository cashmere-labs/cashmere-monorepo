import { logger } from '@cashmere-monorepo/backend-core';
import {
    findTransport,
    getNetworkConfigAndClient,
    multicall3WriteAbi,
} from '@cashmere-monorepo/shared-blockchain';
import { sleep } from 'radash';
import { Config } from 'sst/node/config';
import {
    Address,
    Hex,
    SimulateContractReturnType,
    createWalletClient,
} from 'viem';
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
     * Send a batched tx to the multi call contract
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
        txHash?: string; // Can be undefined if no tx was sent
        successIdx: number[];
        failedIdx: number[];
    }> => {
        // If nothing to do, exit directly
        if (callData.length === 0) {
            throw new Error(
                `Unable to send batched tx, no call data provided, ${
                    callData.length
                } : ${JSON.stringify(callData)}`
            );
        }

        logger.debug(
            {
                chainId,
                nbrOfTx: callData.length,
            },
            'Starting multicall process'
        );

        // Array of all the failed tx index
        const failedIdx: number[] = [];

        // Build the initial call data's
        const callValues = callData.map((data) => ({
            target: data.target,
            callData: data.data,
            allowFailure,
        }));

        // Perform the request, and remove every failing tx's
        let simulationResult: SimulateContractReturnType<
            typeof multicall3WriteAbi,
            'aggregate3'
        >;

        try {
            simulationResult = await client.simulateContract({
                account,
                address: multicallAddress,
                abi: multicall3WriteAbi,
                functionName: 'aggregate3',
                args: [callValues],
                // Put the additional gas param
                ...gasParam,
            });
        } catch (e) {
            logger.warn(
                {
                    chainId,
                    callValues,
                    nbrOfTx: callValues.length,
                    error: e,
                },
                'Unable to perform the simulation'
            );
            // Build our new calldata by removing the last item of the array
            const idxRemoved = callValues.length - 1;
            failedIdx.push(idxRemoved);
            logger.info(
                { chainId, idxRemoved, totalLength: callData.length },
                'Removed an item from our array to call'
            );
            // Wait for 50ms to prevent rpc provider flooding
            await sleep(50);
            // Update our call values
            const newCallData = callData.slice(0, idxRemoved);
            if (newCallData.length !== 0) {
                // Get our result
                const multicallResult = await sendBatchedTx(
                    newCallData,
                    gasParam,
                    allowFailure
                );
                // Add our current idx removed to the array returned
                multicallResult.failedIdx.push(...failedIdx);
                // And return it
                return multicallResult;
            } else {
                // Otherwise, return all the failed tx
                return {
                    successIdx: [],
                    failedIdx,
                };
            }
        }

        // Extract our request
        const request = simulationResult.request;

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
            failedIdx,
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

export type MultiCallRepository = ReturnType<typeof getMultiCallRepository>;
