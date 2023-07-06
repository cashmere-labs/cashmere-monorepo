import { InvalidArgumentsError } from '@cashmere-monorepo/backend-core';
import { getSwapDataRepository } from '@cashmere-monorepo/backend-database';

export interface listSwapsParams {
    page: string;
}

export const listSwaps = async (params: listSwapsParams) => {
    if (!params.page) {
        throw new InvalidArgumentsError('Missing page number');
    }
    const page = parseInt(params.page || '0');

    if (isNaN(page)) {
        throw new InvalidArgumentsError('Page should be a number');
    }

    // Get our swap data repository
    const swapDataRepository = await getSwapDataRepository();

    const { count: total, items: swaps } = await swapDataRepository.getAll({
        page,
    });
    return {
        statusCode: 200,
        body: {
            status: 'OK',
            total,
            swaps,
        },
    };
};
