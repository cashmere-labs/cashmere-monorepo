import { SSTConfig } from "sst";
import {MainStack} from "./stacks/MainStack";
import {SwapParamStack} from "./stacks/SwapParamStack";

export default {
  config(_input) {
    return {
      profile: "monorepo-swarmion-dev",
      name: "cashmere-monorepo",
      region: "us-east-1",
    };
  },
  stacks(app) {
    app.stack(MainStack).stack(SwapParamStack);
  }
} satisfies SSTConfig;
