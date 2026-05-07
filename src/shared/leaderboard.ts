export const DEFAULT_LEADERBOARD_ID = "exit-macpaw-space:v1";
export const LEADERBOARD_CREATED_KEY_PREFIX = "completed";
export const MAX_EPOCH_MS = 9_999_999_999_999;
export const DISPLAY_NAME_MIN_LENGTH = 1;
export const DISPLAY_NAME_MAX_LENGTH = 32;
export const LEADERBOARD_DEFAULT_LIMIT = 10;
export const LEADERBOARD_MAX_LIMIT = 50;
export const COMPLETION_TOKEN_NONCE_BYTES = 16;
export const MAX_COMPLETION_DURATION_MS = 24 * 60 * 60 * 1000;
export const MAX_COMPLETION_ATTEMPTS = 9999;

export type LeaderboardId = typeof DEFAULT_LEADERBOARD_ID | string;
export type LeaderboardCreatedKey = `${typeof LEADERBOARD_CREATED_KEY_PREFIX}#${string}#${string}`;

export interface LeaderboardCompletionMetrics {
  startedAt: string;
  completedAt: string;
  durationMs: number;
  attempts: number;
}

export interface LeaderboardCompletionTokenPayload extends LeaderboardCompletionMetrics {
  leaderboardId: LeaderboardId;
  sessionId: string;
  nonce: string;
}

export interface LeaderboardCompletionTokenResponse {
  token: string;
  metrics: LeaderboardCompletionMetrics;
}

export interface CreateLeaderboardEntryRequest {
  displayName: string;
  completionToken: string;
}

export interface LeaderboardEntry {
  entryId: string;
  leaderboardId: LeaderboardId;
  displayName: string;
  completedAt: string;
  durationMs: number;
  attempts: number;
}

export interface LeaderboardDynamoItem extends LeaderboardEntry {
  createdKey: LeaderboardCreatedKey;
  sessionId: string;
  submittedAt: string;
  tokenNonce: string;
}

export interface LeaderboardListResponse {
  leaderboardId: LeaderboardId;
  sort: "newest-first";
  limit: number;
  entries: LeaderboardEntry[];
}

export interface CreateLeaderboardEntryResponse {
  entry: LeaderboardEntry;
  leaderboard: LeaderboardListResponse;
}

export type LeaderboardErrorCode =
  | "leaderboard-disabled"
  | "writes-disabled"
  | "invalid-request"
  | "invalid-display-name"
  | "missing-completion-token"
  | "invalid-completion-token"
  | "completion-token-used"
  | "storage-not-configured"
  | "storage-error"
  | "rate-limited";

export interface LeaderboardErrorResponse {
  error: {
    code: LeaderboardErrorCode;
    message: string;
  };
}
