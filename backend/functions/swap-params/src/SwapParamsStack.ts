import {Api, StackContext} from "sst/constructs";

const path = "./backend/functions/swap-params/src"

export function SwapParamsStack({ stack }: StackContext) {
  // Build our swap param's API
  const api = new Api(stack, "swap-params-api", {
    // Default prop's for every routes
    defaults: {
      function: {
        // Default timeout to 30seconds
        timeout: "30 seconds",
        // Default memory to 512MB
        memorySize: "512 MB",
      },
    },
    // TODO: Domain name configuration, when domain name will be on route53
    /*customDomain: {
      domainName: `api-${stack.stage}.cashmere.com`,
      hostedZone: "domain.com",
      path: "swapParams/v1",
    },*/
    // Add the routes
    routes: {
      "GET /test-lambda": `${path}/handlers/lambda.handler`
    }
  });

  // Add the outputs to our stack
  stack.addOutputs({
    ApiEndpoint: api.url,
  });
}
