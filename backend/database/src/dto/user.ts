import { Address } from 'viem';

// User interface
export interface UserDbDto {
    address: Address;
    refreshTokenHash?: string;
}
