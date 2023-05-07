import { StackContext, Api } from "sst/constructs";
export declare function ApiStack({ stack }: StackContext): {
    api: Api<Record<string, import("sst/constructs").ApiAuthorizer>>;
};
