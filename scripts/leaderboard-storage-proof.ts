import assert from "node:assert/strict";

import { createLeaderboardCreatedKey } from "../src/server/leaderboard-storage.js";

interface SampleEntry {
  entryId: string;
  completedAt: string;
}

const entries: SampleEntry[] = [
  { entryId: "old", completedAt: "2026-05-07T10:00:00.000Z" },
  { entryId: "newer-b", completedAt: "2026-05-07T10:05:00.000Z" },
  { entryId: "newest", completedAt: "2026-05-07T10:06:00.000Z" },
  { entryId: "newer-a", completedAt: "2026-05-07T10:05:00.000Z" },
];

const ordered = entries
  .map((entry) => ({
    ...entry,
    createdKey: createLeaderboardCreatedKey(entry),
  }))
  .sort((left, right) => left.createdKey.localeCompare(right.createdKey));

assert.deepEqual(
  ordered.map((entry) => entry.entryId),
  ["newest", "newer-a", "newer-b", "old"],
);

assert.equal(
  createLeaderboardCreatedKey({
    entryId: "entry-1",
    completedAt: "2026-05-07T10:06:00.000Z",
  }),
  "completed#8221851639999#entry-1",
);

assert.throws(
  () =>
    createLeaderboardCreatedKey({
      entryId: "bad",
      completedAt: "not-a-date",
    }),
  /valid ISO timestamp/,
);

assert.throws(
  () =>
    createLeaderboardCreatedKey({
      entryId: " ",
      completedAt: "2026-05-07T10:06:00.000Z",
    }),
  /entryId is required/,
);

console.log("Leaderboard storage proof passed.");
