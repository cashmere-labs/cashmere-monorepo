import {StackContext, use} from "sst/constructs";
import {ApiStack} from "@cashmere-monorepo/backend-core/stacks/ApiStack";

const path = "./backend/functions/swap-params/src"

export function SwapParamsStack({ stack }: StackContext) {
  // Import our main api
  const { api } = use(ApiStack)
  // Add the routes for our swap params endpoints
  api.addRoutes(stack,{
    "GET /test-lambda": `${path}/handlers/lambda.handler`
  });
}
