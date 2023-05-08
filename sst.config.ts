import { SSTConfig } from "sst";
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
    // TODO : Should have the core stack (db, redis etc)

    // Every API Stack's
    app.stack(SwapParamsStack);
  }
} satisfies SSTConfig;
