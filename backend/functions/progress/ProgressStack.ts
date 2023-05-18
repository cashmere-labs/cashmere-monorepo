import { StackContext, Table, WebSocketApi } from 'sst/constructs';

const path = './backend/functions/progress/src';

export function ProgressStack({ stack }: StackContext) {
    // Build the table we will use to store each connection
    const socketTable = new Table(stack, 'WebSocketDynamo', {
        fields: {
            id: 'string',
            room: 'string',
        },
        primaryIndex: { partitionKey: 'room', sortKey: 'id' },
        globalIndexes: {
            idIndex: { partitionKey: 'id', sortKey: 'room' },
        },
    });

    // Then, build our websocket api
    const webSocketApi = new WebSocketApi(stack, 'ProgressWebSocketApi', {
        defaults: {
            function: {
                // Bind every function to the socket table by default
                bind: [socketTable],
            },
        },
        // TODO: Domain name configuration, when domain name will be on route53
        customDomain: {
            path: 'progress',
            domainName: `ws-${stack.stage}.aws.cashmere.exchange`.toLowerCase(),
            hostedZone: 'aws.cashmere.exchange',
        },
        // All our web socket routes
        routes: {
            $connect: `${path}/handlers/ws/connect.handler`,
            $disconnect: `${path}/handlers/ws/disconnect.handler`,
            setAddressForProgress: `${path}/handlers/ws/setAddressForProgress.handler`,
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
