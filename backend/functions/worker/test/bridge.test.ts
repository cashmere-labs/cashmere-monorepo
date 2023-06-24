import { scanEveryBlockchain } from '@cashmere-monorepo/backend-service-worker';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../src/handlers/bridge';

vi.mock('@cashmere-monorepo/backend-core', () => ({
    logger: {
        info: vi.fn(),
    },
    useLogger: vi.fn(),
}));

vi.mock('@cashmere-monorepo/backend-service-worker/src', () => ({
    scanEveryBlockchain: vi.fn(),
}));

describe('bridgeHandler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should log a message and execute the bridge event handler', async () => {
        vi.mocked(scanEveryBlockchain).mockResolvedValue(undefined);

        await handler();

        expect(scanEveryBlockchain).toHaveBeenCalled();
    });
});
