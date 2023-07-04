import { TypeSystem } from '@sinclair/typebox/system';
import { v4 as uuidv4 } from 'uuid';
import { Address, isAddress } from 'viem';
const uniqueString = uuidv4();

const key = process.env.NODE_ENV === 'test' ? uniqueString : 'Address';
// Address type validation
export const AddressType = TypeSystem.Type<Address>(key, (options, value) => {
    return typeof value === 'string' && isAddress(value);
});
