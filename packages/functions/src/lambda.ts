import { ApiHandler } from "sst/node/api";
import { Time } from "@cashmere-monorepo-v2/core/time";

export const handler = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: `Hello world. The time is ${Time.now()}`,
  };
});
