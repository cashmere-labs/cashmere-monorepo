import { Api, ApiDomainProps, StackContext, Table } from 'sst/constructs';

export function CoreStack({ stack }: StackContext) {
    // Build our initial API that's linked to our route53 domain
    const api = new Api(stack, 'CoreApi', {
        /*customDomain: {
            domainName: `api-${stack.stage}.route53.cashmere.exchange`.toLowerCase(),
            hostedZone: "route53.cashmere.exchange",
        },*/
        // TODO : This will be used to declare the root custom domain, via CDK, that will be later used by all the child API Gateway
    });

    // Small helper function to build custom domain
    const getDomainPath = (path: string): ApiDomainProps => ({
        path,
        cdk: {
            domainName: api.cdk.domainName,
        },
    });

    // Build our dynamo db table for the caching operation
    const cachingTable = new Table(stack, 'CachingDynamo', {
        fields: {
            id: 'string',
            value: 'string',
            ttl: 'number',
        },
        timeToLiveAttribute: 'ttl',
        primaryIndex: { partitionKey: 'id' },
    });

    // Add the api url and dynamo db table to our stack output
    stack.addOutputs({
        ApiEndpoint: api.url,
        CachingTableId: cachingTable.id,
    });

    // Return our api and dynamo db table
    return { api, getDomainPath, cachingTable };
}
