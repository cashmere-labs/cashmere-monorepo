import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { StackContext } from 'sst/constructs';

/**
 * Stack helping us to retrieve the db environment
 * @param stack
 * @constructor
 */
export function DatabaseStack({ stack }: StackContext) {
    // Get a formatted environment to access the database (prod or dev)
    const stage = stack.stage === 'prod' ? 'prod' : 'dev';

    // Database env
    const environment = {
        // Main mongo
        MONGO_DB_URI: StringParameter.valueForStringParameter(
            stack,
            `/${stage}/databases/mongo/uri`
        ),
        MONGO_DB_NAME: stage,
    };

    // Add the outputs to our stack
    stack.addOutputs({
        MongoDbUri: environment.MONGO_DB_URI,
        MongoDbName: environment.MONGO_DB_NAME,
    });

    return { environment };
}
