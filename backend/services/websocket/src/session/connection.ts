import { logger } from '@cashmere-monorepo/backend-core';
import {
    deleteConnections,
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

    // TODO: Find all the room the user was in, to get the composite key's

    // Delete the entry in our dynamo db table
    await deleteConnections(connectionId, [defaultRoomId]);
};
