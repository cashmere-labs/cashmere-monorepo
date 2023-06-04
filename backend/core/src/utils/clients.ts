import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SQSClient } from '@aws-sdk/client-sqs';

// Client for dynamo DB
export const dynamoDbClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
});

// Client for sqs DB
export const sqsClient = new SQSClient({
    region: process.env.AWS_REGION,
});
