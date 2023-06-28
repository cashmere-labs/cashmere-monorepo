import { transactionsListContract } from './transactionsList';
import { transactionsListDeleteContract } from './transactionsListDelete';
import { transactionsListDeleteSwapIdContract } from './transactionsListDeleteSwapId';
import { undetectedTxIdsContract } from './undetectedTxIds';

/**
 * Contracts for the progress api
 */
export const progressApiContracts = {
    transactionsListContract,
    transactionsListDeleteContract,
    transactionsListDeleteSwapIdContract,
    undetectedTxIdsContract,
};
