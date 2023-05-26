import { Address, getAddress, Hash, Hex } from 'viem';

/**
 * Swap payload interface
 */
interface ISwapPayload {
    lwsPoolId: number;
    hgsPoolId: number;
    dstToken: Address;
    minHgsAmount: bigint;
    receiver: Address;
    signature: Hex;
}

/**
 * Swap payload
 */
export class SwapPayload implements ISwapPayload {
    readonly lwsPoolId: number;
    readonly hgsPoolId: number;
    readonly dstToken: Address;
    readonly minHgsAmount: bigint;
    readonly receiver: Address;
    readonly signature: Hex;

    /**
     * Constructor from interface
     * @param params
     */
    constructor(params: ISwapPayload) {
        [
            this.lwsPoolId,
            this.hgsPoolId,
            this.dstToken,
            this.minHgsAmount,
            this.receiver,
            this.signature,
        ] = [
            params.lwsPoolId,
            params.hgsPoolId,
            params.dstToken,
            params.minHgsAmount,
            params.receiver,
            params.signature,
        ];
    }

    /**
     * Decode swap payload from hash
     * @param data
     */
    static decode(data: Hash) {
        // Decode all the data's
        let payload = data.slice(2);
        const lwsPoolId = parseInt(payload.slice(0, 4), 16); // uint16
        payload = payload.slice(4);
        const hgsPoolId = parseInt(payload.slice(0, 4), 16); // uint16
        payload = payload.slice(4);
        const dstToken = getAddress('0x' + payload.slice(0, 40)); // address
        payload = payload.slice(40);
        const minHgsAmount = BigInt('0x' + payload.slice(0, 64)); // uint256
        payload = payload = payload.slice(64);
        const receiver = getAddress('0x' + payload.slice(0, 40)); // address
        payload = payload.slice(40);
        const signature = ('0x' + payload) as Hex; // bytes

        // Return new swap payload
        return new SwapPayload({
            lwsPoolId,
            hgsPoolId,
            dstToken,
            minHgsAmount,
            receiver,
            signature,
        });
    }
}
