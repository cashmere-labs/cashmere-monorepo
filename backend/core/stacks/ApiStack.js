"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiStack = void 0;
const constructs_1 = require("sst/constructs");
function ApiStack({ stack }) {
    // Build our whole API
    const api = new constructs_1.Api(stack, "api", {
        defaults: {
            function: {
                // Default timeout to 30seconds
                timeout: "30 seconds",
                // Default memory to 512MB
                memorySize: "512 MB",
            },
        },
    });
    // Add the api url to our stack output
    stack.addOutputs({
        ApiEndpoint: api.url,
    });
    // Return our build api
    return { api };
}
exports.ApiStack = ApiStack;
