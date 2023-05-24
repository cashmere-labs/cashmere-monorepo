import { TypeSystem } from '@sinclair/typebox/system';
import { Address, isAddress } from 'viem';

// Address type validation
export const AddressType = TypeSystem.Type<Address>(
    'Address',
    (options, value) => {
        return typeof value === 'string' && isAddress(value);
    }
);
