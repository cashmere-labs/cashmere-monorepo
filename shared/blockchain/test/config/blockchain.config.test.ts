import { describe, expect, it } from 'vitest';
import { getNetworkConfig, getNetworkConfigAndClient } from '../../src';
import { GOERLI_CHAIN_ID } from '../../src/chain/chain.constants';

// Get config test
describe('Get config', () => {
    it('should fail when no config existing', () => {
        expect(() => getNetworkConfig(0)).toThrowError(
            'Config for chain id 0 not found'
        );
    });
    it('should succeed when config exist', () => {
        const chainId = parseInt(GOERLI_CHAIN_ID);
        const networkConfig = getNetworkConfig(chainId);
        expect(networkConfig.chain.id).toBe(chainId);
    });
});

// Get config and client test
describe('Get config and client', () => {
    it('should fail when no config existing', () => {
        expect(() => getNetworkConfigAndClient(0)).toThrowError(
            'Config for chain id 0 not found'
        );
    });
    it('should succeed when config exist', () => {
        const chainId = parseInt(GOERLI_CHAIN_ID);
        const { client, config } = getNetworkConfigAndClient(chainId);
        expect(config.chain.id).toBe(chainId);
        expect(client.chain?.id).toBe(chainId);
    });
});
