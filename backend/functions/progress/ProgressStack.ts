import { ContractApiGatewayRoute } from '@cashmere-monorepo/backend-core/contracts';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import {
    transactionsListContract,
    transactionsListDeleteContract,
    transactionsListDeleteSwapIdContract,
} from '@cashmere-monorepo/shared-contract-progress';
import { Api, StackContext, Table, WebSocketApi, use } from 'sst/constructs';

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

    // Then, build our progress  API
    const httpApi = new Api(stack, 'ProgressHttpApi', {
        // Default prop's for every routes
        defaults: {
            function: {
                // Default timeout to 30seconds
                timeout: '30 seconds',
                // Default memory to 512MB
                memorySize: '512 MB',
            },
        },
        // TODO: Domain name configuration, when domain name will be on route53
        customDomain: use(CoreStack).getDomainPath('progress'),
    });

    // Add the contract routes
    httpApi.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/http/transactionsList.handler`,
            transactionsListContract
        )
    );

    httpApi.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/http/transactionsListDelete.handler`,
            transactionsListDeleteContract
        )
    );

    httpApi.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/http/transactionsListDeleteSwapId.handler`,
            transactionsListDeleteSwapIdContract
        )
    );

    /*
    httpApi.addRoutes(
        stack,
        ContractApiGatewayRoute(
            `${path}/handlers/http/undetectedTxIds.handler`,
            undetectedTxIdsContract
        )
    ); */

    // Add the outputs to our stack
    stack.addOutputs({
        StockTableId: socketTable.id,
        WebSocketApiEndpoint: webSocketApi.url,
        HttpApiEndpoint: httpApi.url,
    });

    // Return the web socket api and http api
    return { webSocketApi, httpApi };
}
