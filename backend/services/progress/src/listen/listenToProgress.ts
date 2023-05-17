import { wsEnterRoom } from '@cashmere-monorepo/backend-service-websocket/src';
import { Address, getAddress } from 'viem';

/**
 * Build the progress room id
 * @param address
 */
const buildProgressRoom = (address: Address) => `progress:${address}`;

/**
 * Add a new progress listener
 * @param connectionId
 * @param address
 */
export const addProgressListener = async (
    connectionId: string,
    address: string
) => {
    // Get the room
    const roomId = buildProgressRoom(getAddress(address));
    // Register the user to the given room
    await wsEnterRoom(connectionId, roomId);
};
