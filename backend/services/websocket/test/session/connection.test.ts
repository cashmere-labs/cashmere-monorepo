import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

describe('[Services][Websocket] Connection events', () => {
    // Mock parameters
    let emptyRooms = false;

    // Tested functions
    let wsConnection: (connectionId: string) => Promise<void>;
    let wsDisconnection: (connectionId: string) => Promise<void>;

    // Mocks
    const deleteConnections = vi.fn();
    const saveNewConnection = vi.fn();
    const getAllRoomForConnectionId = vi.fn(async (connectionId: string) => ({
        Items: emptyRooms
            ? undefined
            : [{ room: { S: connectionId } }, { room: { S: 'default' } }],
    }));

    beforeAll(async () => {
        // Mock wsDynamo.repository
        vi.doMock('../../src/repositories/wsDynamo.repository', () => ({
            deleteConnections,
            saveNewConnection,
            getAllRoomForConnectionId,
        }));
        // Import tested functions after mocking
        ({ wsConnection, wsDisconnection } = await import('../../src'));
    });

    beforeEach(() => {
        // Reset the mocks parameters
        emptyRooms = false;
    });

    afterEach(() => {
        // Reset spy calls
        vi.restoreAllMocks();
    });

    it('[Ok] Saves connection details on connect event', async () => {
        await wsConnection('123');
        expect(saveNewConnection).toBeCalledWith('123', 'default');
    });

    describe('Disconnect event', () => {
        it('[Ok] Disconnects from rooms saved in dynamo', async () => {
            await wsDisconnection('123');
            expect(deleteConnections).toBeCalledWith('123', ['123', 'default']);
        });

        it('[Ok] Disconnects from default room if none are saved in dynamo', async () => {
            emptyRooms = true;
            await wsDisconnection('123');
            expect(deleteConnections).toBeCalledWith('123', ['default']);
        });
    });
});
