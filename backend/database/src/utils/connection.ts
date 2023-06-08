import { Mutex } from 'async-mutex';
import mongoose, { connect, Connection } from 'mongoose';

/**
 * The current mongoose connection
 */
let mongo: typeof mongoose | undefined;

const getMongo = async () => {
    if (!mongo)
        mongo = await connect(process.env.MONGO_DB_URI!, {
            dbName: process.env.MONGO_DB_NAME,
        });
    return mongo;
};

/**
 * The async mutex to connect to the database
 */
const mutex = new Mutex();

/**
 * Get the mongoose connection
 */
export const getMongooseConnection = (): Promise<Connection> =>
    mutex.runExclusive(async () => {
        const mongo = await getMongo();
        // If we already have a connection, return it
        if (mongo.connections?.length) return mongo.connections[0];

        // Otherwise, build it
        return await mongo.createConnection().asPromise();
    });
