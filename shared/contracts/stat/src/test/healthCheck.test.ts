import {
    healthCheckEndpointResponseBodyType,
    testContract,
} from '../healthCheck';

import { describe, expect, it } from 'vitest';

describe('testContract', () => {
    it('should have the correct id', () => {
        expect(testContract.id).toBe('test');
    });

    it('should have the correct path', () => {
        expect(testContract.path).toBe('/api/health-check');
    });

    it('should have the correct method', () => {
        expect(testContract.method).toBe('GET');
    });

    it('should have the correct response schema', () => {
        const {
            properties: {
                body: { properties },
            },
        } = testContract.getOutputSchema();
        expect(properties).toEqual(
            healthCheckEndpointResponseBodyType.properties
        );
    });
});
