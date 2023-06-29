import { AuthStack } from '@cashmere-monorepo/backend-auth/AuthStack';
import { MultiContractsApiGatewayRoute } from '@cashmere-monorepo/backend-core';
import { CoreStack } from '@cashmere-monorepo/backend-core/stacks/CoreStack';
import { progressApiContracts } from '@cashmere-monorepo/shared-contract-progress';
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

    // Import our authorizer
    const { accessTokenAuthorizer } = use(AuthStack);

    // Then, build our websocket api
    const webSocketApi = new WebSocketApi(stack, 'ProgressWebSocketApi', {
        defaults: {
            function: {
                // Bind every function to the socket table by default
                bind: [socketTable],
            },
        },
        // Domain name configuration, when domain name will be on route53
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
        // Domain name configuration, when domain name will be on route53
        customDomain: use(CoreStack).getDomainPath('progress'),
        authorizers: { accessTokenAuthorizer },
    });

    // Add the contract routes
    MultiContractsApiGatewayRoute(stack, httpApi, progressApiContracts, {
        transactionsListContract: {
            handler: `${path}/handlers/http/transactionsList.handler`,
        },
        transactionsListDeleteContract: {
            handler: `${path}/handlers/http/transactionsListDelete.handler`,
        },
        transactionsListDeleteSwapIdContract: {
            handler: `${path}/handlers/http/transactionsListDeleteSwapId.handler`,
        },
        undetectedTxIdsContract: {
            handler: `${path}/handlers/http/undetectedTxIds.handler`,
        },
    });

    // Add the outputs to our stack
    stack.addOutputs({
        StockTableId: socketTable.id,
        WebSocketApiEndpoint: webSocketApi.url,
        HttpApiEndpoint: httpApi.url,
    });

    // Return the web socket api and http api
    return { webSocketApi, httpApi };
}
