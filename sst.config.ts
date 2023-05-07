import { SSTConfig } from "sst";
import {ApiStack} from "./backend/core/stacks/ApiStack";
import {SwapParamsStack} from "./backend/functions/swap-params/src/SwapParamsStack";

export default {
  config(_input) {
    return {
      profile: "monorepo-swarmion-dev",
      name: "cashmere-monorepo",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(ApiStack).stack(SwapParamsStack);
  }
} satisfies SSTConfig;
