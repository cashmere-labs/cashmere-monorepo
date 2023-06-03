import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// Client for dynamo DB
export const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});
