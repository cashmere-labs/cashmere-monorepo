import {StackContext, Api, Cron} from "sst/constructs";

export function API({ stack }: StackContext) {
  // Build our whole API
  const api = new Api(stack, "api", {
    defaults: {
      function: {
        // Default timeout to 30seconds
        timeout: "30 seconds",
        // Default memory to 512MB
        memorySize: "512 MB",
      },
    },
    routes: {
      "GET /test": "packages/functions/src/lambda.handler",
    },
  });
  // Add the api url to our stack output
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
