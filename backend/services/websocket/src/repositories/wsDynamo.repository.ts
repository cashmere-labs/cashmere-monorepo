import {
    BatchWriteItemCommand,
    PutItemCommand,
    QueryCommand,
} from '@aws-sdk/client-dynamodb';
import { dynamoDbClient } from '@cashmere-monorepo/backend-core/src/utils';
import { Table } from 'sst/node/table';
import { defaultRoomId } from '../session';

/**
 * Save a new connection in our dynamo db table
 * @param connectionId
 * @param roomId
 */
export const saveNewConnection = async (connectionId: string, roomId: string) =>
    await dynamoDbClient.send(
        new PutItemCommand({
            TableName: Table.WebSocketDynamo.tableName,
            Item: {
                id: { S: connectionId },
                room: { S: defaultRoomId },
            },
        })
    );

/**
 * Delete a range of connection
 * @param connectionId
 * @param roomIds
 */
export const deleteConnections = async (
    connectionId: string,
    roomIds: string[]
) =>
    await dynamoDbClient.send(
        new BatchWriteItemCommand({
            RequestItems: {
                [Table.WebSocketDynamo.tableName]: [
                    {
                        DeleteRequest: {
                            Key: { id: { S: connectionId } },
                        },
                    },
                ],
            },
        })
    );

/**
 * Get all the connection ids for a given room
 * @param roomId
 */
export const getAllConnectionIdsForRoom = async (roomId: string) =>
    await dynamoDbClient.send(
        new QueryCommand({
            TableName: Table.WebSocketDynamo.tableName,
            ExpressionAttributeValues: {
                ':roomId': { S: roomId },
            },
            KeyConditionExpression: 'room = :roomId',
        })
    );

/**
 * Get all the connection ids for a given room
 * @param roomId
 */
export const getAllRoomForConnectionId = async (connectionId: string) =>
    await dynamoDbClient.send(
        new QueryCommand({
            TableName: Table.WebSocketDynamo.tableName,
            IndexName: 'idIndex',
            ExpressionAttributeValues: {
                ':id': { S: connectionId },
            },
            KeyConditionExpression: 'id = :id',
        })
    );
