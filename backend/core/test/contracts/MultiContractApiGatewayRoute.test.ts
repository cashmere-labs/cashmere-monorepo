import { buildSstApiGatewayContract } from '@cashmere-monorepo/shared-contract-core';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { MultiContractsApiGatewayRoute } from '../../src';

describe('[Backend][Core] Multi contract api gateway route', () => {
    // The function we will test
    let MultiContractsApiGatewayRouteTest: typeof MultiContractsApiGatewayRoute;

    // A mocked scope
    const scopeMock = {
        stage: 'test',
    };

    // A mocked api
    const apiMock = {
        addRoutes: vi.fn(),
    };

    // A test api gateway contract
    const testContracts = {
        testFunctionContractGet: buildSstApiGatewayContract({
            id: 'testFunctionContract',
            path: '/testFunctionContract',
            method: 'GET',
        }),
        testFunctionContractPost: buildSstApiGatewayContract({
            id: 'testFunctionContract',
            path: '/testFunctionContract',
            method: 'POST',
        }),
    };

    beforeAll(async () => {
        // Get the function to test
        MultiContractsApiGatewayRouteTest = (
            await import('../../src/contracts/MultiContractApiGatewayRoute')
        ).MultiContractsApiGatewayRoute;
    });

    /**
     * After each test, restore all mocks
     */
    afterEach(() => {
        // Restore all mocks
        vi.restoreAllMocks();
    });

    it('[Ok] Should create all the routes for a given contract', async () => {
        // Call the function to test
        MultiContractsApiGatewayRouteTest(
            scopeMock as any,
            apiMock as any,
            testContracts,
            {
                testFunctionContractGet: {
                    handler: 'testHandler',
                },
                testFunctionContractPost: {
                    handler: 'testHandler',
                },
            }
        );
        // Ensure the api add routes has been called
        expect(apiMock.addRoutes).toHaveBeenCalledOnce();
        expect(apiMock.addRoutes).toHaveBeenCalledWith(scopeMock, {
            'GET /testFunctionContract': {
                function: {
                    functionName: 'test-ApiGET_testFunctionContract',
                    handler: 'testHandler',
                },
            },
            'POST /testFunctionContract': {
                function: {
                    functionName: 'test-ApiPOST_testFunctionContract',
                    handler: 'testHandler',
                },
            },
        });
    });

    it('[Ok] Should fail if a config is missing', async () => {
        // Call the function to test
        expect(() =>
            MultiContractsApiGatewayRouteTest(
                scopeMock as any,
                apiMock as any,
                testContracts,
                {
                    testFunctionContractGet: {
                        handler: 'testHandler',
                    },
                }
            )
        ).toThrowError(
            new Error(
                'No config found for contract with id testFunctionContract'
            )
        );
        // Ensure the api add routes has been called
        expect(apiMock.addRoutes).not.toHaveBeenCalledOnce();
    });
});
