import {
    findTransport,
    getNetworkConfigAndClient,
} from '@cashmere-monorepo/shared-blockchain';
import { Config } from 'sst/node/config';
import { Address, Hex, createWalletClient, multicall3Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

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
     */
    const sendBatchedTx = async (
        callData: MultiCallFunctionData[],
        allowFailure: boolean = false
    ) => {
        // Build the call data's
        const callValues = callData.map((data) => ({
            target: data.to,
            callData: data.data,
            value: 0n,
            allowFailure,
        }));

        // Try to simulate the request
        const { request } = await client.simulateContract({
            account,
            address: multicallAddress,
            abi: [multicall3Abi],
            functionName: 'aggregate3',
            args: [callValues],
        });

        // TODO: If gas estimation present, ensure this multicall3 aggregate call is lower than the given params

        // TODO: Try catch with fallback mecanism, like simulating each tx one by one and checking which one failed
        // TODO: Binary search to identify the failing tx?

        // Execute the tx
        await privateClient.writeContract(request);
    };

    return {
        sendBatchedTx,
    };
};

export type MultiCallFunctionData = {
    readonly to: Address;
    readonly data: Hex;
};
