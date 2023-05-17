import { Mutex } from 'async-mutex';
import { connect, Connection } from 'mongoose';

/**
 * The current mongoose connection
 */
let connection: Connection | undefined;

/**
 * The async mutex to connect to the database
 */
const mutex = new Mutex();

/**
 * Get the mongoose connection
 */
export const getMongooseConnection = (): Promise<Connection> =>
    mutex.runExclusive(async () => {
        // If we already have a connection, return it
        if (connection) return connection;

        // Otherwise, build it
        const builtMongoose = await connect(process.env.MONGO_DB_URI!, {
            dbName: process.env.MONGO_DB_NAME,
        });
        const newConnection = await builtMongoose
            .createConnection()
            .asPromise();
        connection = newConnection;
        return newConnection;
    });
