import { Address, Hex } from 'viem';

// Interface for batched tx
export interface BatchedTxDbDto {
    chainId: number;
    priority: number;
    target: Address;
    data: Hex;
    securityHash: string;
    status: TxStatus;
}

export interface TxStatus {
    type: 'queued' | 'sent';
}

export interface TxStatusQueued extends TxStatus {
    type: 'queued';
}

export interface TxStatusSent extends TxStatus {
    type: 'sent';
    hash: Hex;
}
