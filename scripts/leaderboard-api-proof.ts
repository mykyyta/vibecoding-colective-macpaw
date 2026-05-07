import assert from "node:assert/strict";

import {
  createMemoryLeaderboardStore,
  handleCreateLeaderboardEntry,
  handleListLeaderboard,
  registerQuestSessionTurn,
} from "../src/server/leaderboard.js";
import {
  DEFAULT_LEADERBOARD_ID,
  type CreateLeaderboardEntryResponse,
  type LeaderboardErrorResponse,
  type LeaderboardListResponse,
} from "../src/shared/leaderboard.js";

const config = {
  enabled: true,
  writesEnabled: true,
  leaderboardId: DEFAULT_LEADERBOARD_ID,
  completionTokenSecret: "test-secret",
  maxEntries: 10,
};
const store = createMemoryLeaderboardStore();
const session = registerQuestSessionTurn({
  completed: true,
  config,
});

assert.ok(session.completion?.token);

const createResult = await handleCreateLeaderboardEntry({
  request: {
    body: {
      displayName: " Myk ",
      completionToken: session.completion.token,
    },
  } as never,
  store,
  config,
});

assert.equal(createResult.status, 201);
assert.equal(
  (createResult.body as CreateLeaderboardEntryResponse).entry.displayName,
  "Myk",
);

const listResult = await handleListLeaderboard({
  request: {
    query: {
      limit: "5",
    },
  } as never,
  store,
  config,
});

assert.equal(listResult.status, 200);
assert.equal((listResult.body as LeaderboardListResponse).entries.length, 1);

const duplicateResult = await handleCreateLeaderboardEntry({
  request: {
    body: {
      displayName: "Other",
      completionToken: session.completion.token,
    },
  } as never,
  store,
  config,
});

assert.equal(duplicateResult.status, 409);
assert.equal(
  (duplicateResult.body as LeaderboardErrorResponse).error.code,
  "completion-token-used",
);

console.log("Leaderboard API proof passed.");
