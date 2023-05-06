import {Api, StackContext, use} from "sst/constructs";
import {MainStack} from "./MainStack";

export function SwapParamStack({ stack }: StackContext) {
    // Import our main api
    const { api } = use(MainStack)
    // Add the routes for our swap params endpoints
    api.addRoutes(stack,{
        "GET /swap-params/estimate": "../packages/api/swap-params/src/lambda.handler"
    });
}