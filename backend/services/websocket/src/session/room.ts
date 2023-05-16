import { logger } from '@cashmere-monorepo/backend-core';
import {
    deleteConnections,
    getAllConnectionIdsForRoom,
    saveNewConnection,
} from '../repositories/wsDynamo.repository';

/**
 * Default room id
 */
export const defaultRoomId = 'default';

/**
 * Join a websocket room
 * @param connectionId
 * @param roomId
 */
export const wsEnterRoom = async (connectionId: string, roomId: string) => {
    logger.debug({ connectionId, roomId }, 'Joining a room');

    // Save a new connection to the given room id
    await saveNewConnection(connectionId, roomId);
};

/**
 * Leave a websocket room
 * @param connectionId
 * @param roomId
 */
export const wsLeaveRoom = async (connectionId: string, roomId: string) => {
    logger.debug({ connectionId, roomId }, 'Leaving a room');

    // Delete a connection to the given room id
    await deleteConnections(connectionId, [roomId]);
};

/**
 * Get all the connection ids for a given room
 * @param roomId
 */
export const getAllConnectionsForRoomId = async (
    roomId: string
): Promise<string[]> => {
    logger.debug({ roomId }, 'Getting all connections for a room');

    // Get all the connection ids for a given room
    const dynamoItems = await getAllConnectionIdsForRoom(roomId);
    return (
        (dynamoItems.Items?.map((item) => item.id.S)?.filter(
            (id) => id !== undefined
        ) as string[]) ?? []
    );
};
