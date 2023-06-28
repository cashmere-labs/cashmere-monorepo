import { GenericApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { Api, Stack } from 'sst/constructs';
import { ApiRouteProps } from 'sst/constructs/Api';
import { FunctionProps } from 'sst/constructs/Function';

/**
 * Config for each routes
 */
type RouteConfig<AuthorizerKeys> = {
    handler: string;
    additionalFunctionProps?: Omit<FunctionProps, 'handler'>;
    additionalRouteProps?: Omit<ApiRouteProps<AuthorizerKeys>, 'function'>;
};

/**
 * Build all the contracts for the given api gateway routes
 * @param scope
 * @param api
 * @param contracts
 * @param configs
 * @constructor
 */
export const MultiContractsApiGatewayRoute = <
    AuthorizerKeys,
    Contracts extends Record<string, GenericApiGatewayContract> = Record<
        string,
        GenericApiGatewayContract
    >,
    ContractsKeys extends keyof Contracts = keyof Contracts
>(
    scope: Stack,
    api: Api,
    contracts: Contracts,
    configs: Record<ContractsKeys, RouteConfig<AuthorizerKeys>>
) => {
    // Build the routes for each contracts
    const routes = Object.entries(contracts).reduce((acc, [key, contract]) => {
        // Find the config
        const config = configs[key as keyof typeof configs];
        if (!config) {
            throw new Error(
                `No config found for contract with id ${contract.id}`
            );
        }
        // Return the route
        return {
            ...acc,
            ...mapContractToRoute(scope.stage, contract, config),
        };
    }, {} as Record<string, ApiRouteProps<string>>);
    // Then add each routes to the api
    api.addRoutes(scope, routes);
};

/**
 * Map a single contract to a route
 * @param stage
 * @param contract
 * @param config
 */
const mapContractToRoute = <AuthorizerKeys>(
    stage: string,
    contract: GenericApiGatewayContract,
    config: RouteConfig<AuthorizerKeys>
) => {
    // Build default function name
    const defaultFuntionName = `${stage}-${contract.method}_-_${contract.id}`;

    // Return the route
    return {
        [contract.method + ' ' + contract.path]: {
            function: {
                ...(config.additionalFunctionProps ?? []),
                handler: config.handler,
                functionName:
                    config.additionalFunctionProps?.functionName ??
                    defaultFuntionName,
            },
            ...(config.additionalRouteProps ?? []),
        },
    };
};
