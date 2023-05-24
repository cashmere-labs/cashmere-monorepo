import { AddressType } from './address';
import { AuthRequestContextType } from './auth';
import { HexType } from './hex';

// Custom types namespace
export namespace CustomType {
    export const Address = AddressType;
    export const Hex = HexType;
    export const Hash = HexType;

    export const AuthRequestContext = AuthRequestContextType;
}
