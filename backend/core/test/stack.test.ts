import { App, use } from 'sst/constructs';
import { initProject } from 'sst/project';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreStack } from '../stacks/CoreStack';

/**
 * Core stack test
 */
describe('[Stack] Core', () => {
    // The current app used to perform the test
    let app: App;

    // Before each test, init project and deploy core stack
    beforeEach(async () => {
        vi.useFakeTimers();

        // Init project and deploy core stack
        await initProject({});
        app = new App({ mode: 'deploy' });
        app.stack(CoreStack);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    /**
     * Ensure all exports are good
     */
    it('[Ok] All export are goods', () => {
        // Get the stack output
        const stackOutput = use(CoreStack);
        expect(stackOutput).toBeDefined();
        expect(stackOutput.api).toBeDefined();
        expect(stackOutput.getDomainPath).toBeDefined();
        expect(stackOutput.cachingTable).toBeDefined();
        expect(stackOutput.mutexTable).toBeDefined();
    });
});
