import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { Table } from 'sst/node/table';
import { defaultRoomId } from '../session/room';

// Access to our dynamoDB
// TODO: Should check if we have the region on the env variable, if not add it
const dynamoDbClient = new DynamoDB({ region: 'us-east-1' });

/**
 * Save a new connection in our dynamo db table
 * @param connectionId
 * @param roomId
 */
export const saveNewConnection = async (connectionId: string, roomId: string) =>
    await dynamoDbClient.putItem({
        TableName: Table.WebSocketDynamo.tableName,
        Item: {
            id: { S: connectionId },
            room: { S: defaultRoomId },
        },
    });

/**
 * Delete a range of connection
 * @param connectionId
 * @param roomIds
 */
export const deleteConnections = async (
    connectionId: string,
    roomIds: string[]
) =>
    await dynamoDbClient.batchWriteItem({
        RequestItems: {
            [Table.WebSocketDynamo.tableName]: [
                {
                    DeleteRequest: {
                        Key: { id: { S: connectionId } },
                    },
                },
            ],
        },
    });

/**
 * Get all the connection ids for a given room
 * @param roomId
 */
export const getAllConnectionIdsForRoom = async (roomId: string) =>
    await dynamoDbClient.query({
        TableName: Table.WebSocketDynamo.tableName,
        ExpressionAttributeValues: {
            ':roomId': { S: roomId },
        },
        KeyConditionExpression: 'room = :roomId',
    });

/**
 * Get all the connection ids for a given room
 * @param roomId
 */
export const getAllRoomForConnectionId = async (connectionId: string) =>
    await dynamoDbClient.query({
        TableName: Table.WebSocketDynamo.tableName,
        IndexName: 'idIndex',
        ExpressionAttributeValues: {
            ':id': { S: connectionId },
        },
        KeyConditionExpression: 'id = :id',
    });
