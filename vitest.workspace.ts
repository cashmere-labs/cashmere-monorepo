import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
    'backend/auth',
    'backend/blockchain',
    'backend/core',
    'backend/database',
    'backend/functions/progress',
    'backend/functions/swap-params',
    'backend/functions/worker',
    'backend/services/auth',
    'backend/services/progress',
    'backend/services/swap',
    'backend/services/websocket',
    'backend/services/worker',
    'shared/blockchain',
]);
