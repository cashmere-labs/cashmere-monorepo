import { loginContract } from './login';
import { logoutContract } from './logout';
import { nonceContract } from './nonce';
import { refreshContract } from './refresh';

/**
 * The contracts for the auth API
 */
export const loginApiContracts = {
    loginContract,
    logoutContract,
    nonceContract,
    refreshContract,
};
