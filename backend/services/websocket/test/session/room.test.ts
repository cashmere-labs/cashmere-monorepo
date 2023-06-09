import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

describe('[Services][Websocket] Room events', () => {
    // Mock parameters
    let emptyConnections = false;

    // Tested functions
    let wsEnterRoom: (connectionId: string, roomId: string) => Promise<void>;
    let wsLeaveRoom: (connectionId: string, roomId: string) => Promise<void>;
    let getAllConnectionsForRoomId: (roomId: string) => Promise<string[]>;

    // Mocks
    const deleteConnections = vi.fn();
    const saveNewConnection = vi.fn();
    const getAllConnectionIdsForRoom = vi.fn(async (roomId: string) => ({
        Items: emptyConnections
            ? undefined
            : [{ id: { S: roomId } }, { id: { S: 'default' } }],
    }));

    beforeAll(async () => {
        // Mock wsDynamo.repository
        vi.doMock('../../src/repositories/wsDynamo.repository', () => ({
            deleteConnections,
            saveNewConnection,
            getAllConnectionIdsForRoom,
        }));
        // Import tested functions after mocking
        ({ wsEnterRoom, wsLeaveRoom, getAllConnectionsForRoomId } =
            await import('../../src/session/room'));
    });

    beforeEach(() => {
        // Reset the mocks parameters
        emptyConnections = false;
    });

    afterEach(() => {
        // Reset spy calls
        vi.restoreAllMocks();
    });

    it('[Ok] Saves connection details on enter room event', async () => {
        await wsEnterRoom('123', 'abc');
        expect(saveNewConnection).toBeCalledWith('123', 'abc');
    });

    it('[Ok] Removes connection details on leave room event', async () => {
        await wsLeaveRoom('123', 'abc');
        expect(deleteConnections).toBeCalledWith('123', ['abc']);
    });

    describe('Get connections for room id', () => {
        it('[Ok] Returns connection list', async () => {
            expect(await getAllConnectionsForRoomId('room')).toEqual([
                'room',
                'default',
            ]);
        });

        it('[Ok] Returns empty list for no connections', async () => {
            emptyConnections = true;
            expect(await getAllConnectionsForRoomId('room')).toEqual([]);
        });
    });
});
