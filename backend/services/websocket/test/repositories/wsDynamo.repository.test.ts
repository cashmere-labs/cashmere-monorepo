import {
    $Command,
    BatchWriteItemCommand,
    PutItemCommand,
    QueryCommand,
    QueryCommandOutput,
} from '@aws-sdk/client-dynamodb';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('[Services][Websocket] DynamoDB repository', () => {
    // Mocks
    const send = vi.fn((command: $Command<any, any, any>) => {
        if (command.constructor.name === 'QueryCommand')
            return `query: ${command.input.KeyConditionExpression}`;
    });

    // Tested functions
    let saveNewConnection: (
        connectionId: string,
        roomId: string
    ) => Promise<any>;
    let deleteConnections: (
        connectionId: string,
        roomIds: string[]
    ) => Promise<any>;
    let getAllConnectionIdsForRoom: (
        roomId: string
    ) => Promise<QueryCommandOutput>;
    let getAllRoomForConnectionId: (
        connectionId: string
    ) => Promise<QueryCommandOutput>;

    beforeAll(async () => {
        // Mock dynamodb
        vi.doMock('@aws-sdk/client-dynamodb', () => ({
            DynamoDBClient: class {
                constructor() {}
                send = send;
            },
            PutItemCommand,
            BatchWriteItemCommand,
            QueryCommand,
        }));
        // Mock sst table
        vi.doMock('sst/node/table', () => ({
            Table: {
                WebSocketDynamo: {
                    tableName: 'WebSocketDynamo',
                },
            },
        }));
        // Import tested functions after mocking
        ({
            saveNewConnection,
            deleteConnections,
            getAllConnectionIdsForRoom,
            getAllRoomForConnectionId,
        } = await import('../../src/repositories/wsDynamo.repository'));
    });

    afterEach(() => {
        // Reset spy calls
        vi.restoreAllMocks();
    });

    it('[Ok] Saves new connections', async () => {
        await saveNewConnection('123', 'abc');
        // Verify dynamo call
        expect(send.mock.calls[0][0].input).toMatchObject(
            new PutItemCommand({
                TableName: 'WebSocketDynamo',
                Item: {
                    id: { S: '123' },
                    room: { S: 'default' },
                },
            }).input
        );
    });

    it('[Ok] Deletes connections', async () => {
        await deleteConnections('123', ['abc']);
        // Verify dynamo call
        expect(send.mock.calls[0][0].input).toMatchObject(
            new BatchWriteItemCommand({
                RequestItems: {
                    WebSocketDynamo: [
                        {
                            DeleteRequest: {
                                Key: {
                                    id: { S: '123' },
                                },
                            },
                        },
                    ],
                },
            }).input
        );
    });

    it('[Ok] Retrieves connections for a given room', async () => {
        // Should return what's returned by dynamo
        expect(await getAllConnectionIdsForRoom('abc')).toEqual(
            'query: room = :roomId'
        );
        // Verify dynamo call
        expect(send.mock.calls[0][0].input).toMatchObject(
            new QueryCommand({
                TableName: 'WebSocketDynamo',
                ExpressionAttributeValues: {
                    ':roomId': { S: 'abc' },
                },
                KeyConditionExpression: 'room = :roomId',
            }).input
        );
    });

    it('[Ok] Retrieves rooms for a given connection', async () => {
        // Should return what's returned by dynamo
        expect(await getAllRoomForConnectionId('123')).toEqual(
            'query: id = :id'
        );
        // Verify dynamo call
        expect(send.mock.calls[0][0].input).toMatchObject(
            new QueryCommand({
                TableName: 'WebSocketDynamo',
                IndexName: 'idIndex',
                ExpressionAttributeValues: {
                    ':id': { S: '123' },
                },
                KeyConditionExpression: 'id = :id',
            }).input
        );
    });
});
