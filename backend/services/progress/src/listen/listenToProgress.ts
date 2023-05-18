import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';
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
    // Format the address
    const addressFormatted = getAddress(address);
    // Get the room
    const roomId = buildProgressRoom(addressFormatted);
    // Register the user to the given room
    await wsEnterRoom(connectionId, roomId);

    // Get our swap data repository
    const swapDataRepository = await getSwapDataRepository();

    // Get all the swap data for our user
    const swapDatasForUser = swapDataRepository.getByReceiver(
        addressFormatted,
        {
            progressHidden: null,
            swapContinueConfirmed: null,
        }
    );

    /*
    TODO:
                client.emit('pendingCount', count);
                items.forEach((swapData) =>
                    client.emit('progressUpdate', swapData)
                );

     */
};
