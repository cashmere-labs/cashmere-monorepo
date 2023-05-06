import { ApiHandler } from "sst/node/api";
import { Time } from "@cashmere-monorepo/core";

export const handler = ApiHandler(async (_evt) => {
  return {
    statusCode: 200,
    body: `Hello world. The time is ${Time.now()}, and it's now updated two times`,
  };
});
