import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

import type { LeaderboardDynamoItem, LeaderboardEntry } from "../shared/leaderboard.js";
import {
  ConditionalWriteFailure,
  type LeaderboardStore,
} from "./leaderboard.js";

export function createDynamoLeaderboardStore(env = process.env): LeaderboardStore {
  const tableName = env.LEADERBOARD_TABLE_NAME;
  const region = env.AWS_REGION || env.AWS_DEFAULT_REGION || "eu-central-1";

  if (!tableName) {
    throw new Error("Leaderboard DynamoDB table name is not configured.");
  }

  const client = new DynamoDBClient({
    region,
    endpoint: env.DYNAMODB_ENDPOINT || undefined,
  });
  const documentClient = DynamoDBDocumentClient.from(client);

  return {
    async list(limit) {
      const result = await documentClient.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: "leaderboardId = :leaderboardId",
          ExpressionAttributeValues: {
            ":leaderboardId": env.LEADERBOARD_ID || "exit-macpaw-space:v1",
          },
          Limit: limit,
          ScanIndexForward: true,
        }),
      );

      return (result.Items ?? []).map((item) =>
        toLeaderboardEntry(item as LeaderboardDynamoItem),
      );
    },
    async create(item) {
      try {
        await documentClient.send(
          new PutCommand({
            TableName: tableName,
            Item: item,
            ConditionExpression:
              "attribute_not_exists(leaderboardId) AND attribute_not_exists(createdKey)",
          }),
        );
      } catch (error) {
        if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
          throw new ConditionalWriteFailure();
        }

        throw error;
      }

      return toLeaderboardEntry(item);
    },
  };
}

function toLeaderboardEntry(item: LeaderboardDynamoItem): LeaderboardEntry {
  return {
    entryId: item.entryId,
    leaderboardId: item.leaderboardId,
    displayName: item.displayName,
    completedAt: item.completedAt,
    durationMs: item.durationMs,
    attempts: item.attempts,
  };
}
