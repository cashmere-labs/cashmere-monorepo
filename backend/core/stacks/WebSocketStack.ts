import { StackContext, Table, WebSocketApi } from 'sst/constructs';

const path = './backend/functions/core/src';

/**
 * Base stack for our web socket
 */
export function WebSocketStack({ stack }: StackContext) {
    // Build the table we will use to store each connection
    const socketTable = new Table(stack, 'SocketTable', {
        fields: {
            id: 'string',
        },
        primaryIndex: { partitionKey: 'id' },
    });

    // Then, build our websocket api
    const webSocketApi = new WebSocketApi(stack, 'WebSocketApi', {
        defaults: {
            function: {
                // Bind every function to the socket table by default
                bind: [socketTable],
            },
        },
        // TODO: Domain name configuration, when domain name will be on route53
        /*customDomain: use(CoreStack).getDomainPath("params") */
        // All our web socket routes
        routes: {
            $connect: `${path}/handlers/ws/connect.handler`,
            $disconnect: `${path}/handlers/ws/disconnect.handler`,
        },
    });

    // Add the outputs to our stack
    stack.addOutputs({
        StockTableId: socketTable.id,
        WebSocketApiEndpoint: webSocketApi.url,
    });

    // Return the web socket api
    return { webSocketApi };
}
