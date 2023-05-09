import { Api, StackContext } from 'sst/constructs';

export function CoreStack({ stack }: StackContext) {
    // Build our whole API
    const api = new Api(stack, 'api', {
        defaults: {
            function: {
                // Default timeout to 30seconds
                timeout: '30 seconds',
                // Default memory to 512MB
                memorySize: '512 MB',
            },
        },
    });
    // Add the api url to our stack output
    stack.addOutputs({
        ApiEndpoint: api.url,
    });
    // Return our build api
    return { api };
}
