import { SwapDataSchema } from '../schema/swapData.schema';
import { getMongooseConnection } from '../utils/connection';

/**
 * Get the swap data repository
 * @param connection
 */
const getSwapDataRepository = async () => {
    // Get the current connection
    const connection = await getMongooseConnection();
    // Get our swap data model
    const model = connection.model('SwapData', SwapDataSchema);
};
