import { WebSocketStack } from '@cashmere-monorepo/backend-core/stacks/WebSocketStack';
import { StackContext, use } from 'sst/constructs';

const path = './backend/functions/progress/src';

export function ProgressStack({ stack }: StackContext) {
    // Get the web socket api
    const { webSocketApi } = use(WebSocketStack);

    // Add the set address route for progress
    webSocketApi.addRoutes(stack, {
        setAddressForProgress: `${path}/handlers/ws/setAddressForProgress.handler`,
    });

    // TODO: Also port the http api of the progress?
}
