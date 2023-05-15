import { GenericApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { ApiRouteProps } from 'sst/constructs/Api';
import { FunctionProps } from 'sst/constructs/Function';

// Build an SST Api Gateway route function
export const ContractApiGatewayRoute = <AuthorizerKeys>(
    handlerPath: string,
    schema: GenericApiGatewayContract,
    additionalFunctionProps?: FunctionProps
): Record<string, ApiRouteProps<AuthorizerKeys>> => ({
    [schema.method + ' ' + schema.path]: {
        function: {
            handler: handlerPath,
            ...(additionalFunctionProps ?? []),
        },
    },
});
