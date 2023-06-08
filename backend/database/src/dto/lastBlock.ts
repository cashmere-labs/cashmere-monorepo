// Last block database DTO
export interface LastBlockDbDto {
    chainId: number;
    type: LastBlockType;
    blockNumber: number;
}

// Last block type
export type LastBlockType = 'bridge' | 'supervisor';
