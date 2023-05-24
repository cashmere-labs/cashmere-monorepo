import { Address } from 'viem';

// JWT payload type
export type JwtPayload = {
    sub: Address;
};
