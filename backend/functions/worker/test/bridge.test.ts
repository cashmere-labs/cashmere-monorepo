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
        vi.stubEnv('STAGE', 'prod');
        vi.mocked(scanEveryBlockchain).mockResolvedValue(undefined);

        // @ts-ignore
        await handler();

        expect(scanEveryBlockchain).toHaveBeenCalledOnce();
    });

    it('shouldnt do anything if not in prod', async () => {
        vi.stubEnv('STAGE', 'test');
        vi.mocked(scanEveryBlockchain).mockResolvedValue(undefined);

        // @ts-ignore
        await handler();

        expect(scanEveryBlockchain).not.toHaveBeenCalledOnce();
    });
});
