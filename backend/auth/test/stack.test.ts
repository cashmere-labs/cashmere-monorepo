import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { App, use } from 'sst/constructs';
import { initProject } from 'sst/project';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthStack } from '../AuthStack';

/**
 * Auth stack test
 */
describe('[Stack] Auth', () => {
    // The current app used to perform the test
    let app: App;

    // Before each test, init project and deploy core stack
    beforeEach(async () => {
        vi.useFakeTimers();

        // Init project and deploy core stack
        await initProject({});
        app = new App({ mode: 'deploy' });
        app.stack(CoreStack);
        app.stack(AuthStack);
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    /**
     * Ensure all exports are good
     */
    it('[Ok] All export are goods', () => {
        // Get the stack output
        const stackOutput = use(AuthStack);
        expect(stackOutput).toBeDefined();
        expect(stackOutput.accessTokenAuthorizer).toBeDefined();
    });
});
