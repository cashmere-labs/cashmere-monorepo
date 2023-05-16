import { logger } from '@cashmere-monorepo/backend-core';
import {
    deleteConnections,
    getAllRoomForConnectionId,
    saveNewConnection,
} from '../repositories/wsDynamo.repository';
import { defaultRoomId } from './room';

/**
 * Handle a new web socket connection.
 * @param connectionId
 */
export const wsConnection = async (connectionId: string) => {
    logger.debug({ connectionId }, 'New web socket connection');

    // Add a new entry in our dynamo db table
    await saveNewConnection(connectionId, defaultRoomId);
};

/**
 * Handle a web socket disconnection.
 * @param connectionId
 */
export const wsDisconnection = async (connectionId: string) => {
    logger.debug({ connectionId }, 'Web socket disconnection');

    // Get all the room for the given connection id
    const dynamoItems = await getAllRoomForConnectionId(connectionId);
    const rooms = (dynamoItems.Items?.map((item) => item.room.S)?.filter(
        (room) => room !== undefined
    ) as string[]) ?? [defaultRoomId];

    // Delete the entry in our dynamo db table
    await deleteConnections(connectionId, rooms);
};
