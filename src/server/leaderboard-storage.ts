import {
  LEADERBOARD_CREATED_KEY_PREFIX,
  MAX_EPOCH_MS,
  type LeaderboardCreatedKey,
} from "../shared/leaderboard.js";

const REVERSE_EPOCH_WIDTH = 13;

export function createLeaderboardCreatedKey(input: {
  completedAt: string;
  entryId: string;
}): LeaderboardCreatedKey {
  const completedAtEpochMs = Date.parse(input.completedAt);

  if (!Number.isInteger(completedAtEpochMs)) {
    throw new Error("completedAt must be a valid ISO timestamp.");
  }

  if (completedAtEpochMs < 0 || completedAtEpochMs > MAX_EPOCH_MS) {
    throw new Error(`completedAt must resolve to an epoch between 0 and ${MAX_EPOCH_MS}.`);
  }

  const entryId = input.entryId.trim();

  if (!entryId) {
    throw new Error("entryId is required.");
  }

  const reverseEpochMs = String(MAX_EPOCH_MS - completedAtEpochMs).padStart(
    REVERSE_EPOCH_WIDTH,
    "0",
  );

  return `${LEADERBOARD_CREATED_KEY_PREFIX}#${reverseEpochMs}#${entryId}`;
}
