import { Api, StackContext } from 'sst/constructs';

export function CoreStack({ stack }: StackContext) {
    // Build our whole API
    const api = new Api(stack, 'api', {
        // TODO : This will be used to declare the root custom domain, via CDK, that will be later used by all the child API Gateway
    });
    // Add the api url to our stack output
    stack.addOutputs({
        ApiEndpoint: api.url,
    });
    // Return our build api
    return { api };
}
