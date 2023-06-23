import {
    healthCheckContract,
    healthCheckEndpointResponseBodyType,
} from '../healthCheck';

import { describe, expect, it } from 'vitest';

describe('testContract', () => {
    it('should have the correct id', () => {
        expect(healthCheckContract.id).toBe('test');
    });

    it('should have the correct path', () => {
        expect(healthCheckContract.path).toBe('/api/health-check');
    });

    it('should have the correct method', () => {
        expect(healthCheckContract.method).toBe('GET');
    });

    it('should have the correct response schema', () => {
        const {
            properties: {
                body: { properties },
            },
        } = healthCheckContract.getOutputSchema();
        expect(properties).toEqual(
            healthCheckEndpointResponseBodyType.properties
        );
    });
});
