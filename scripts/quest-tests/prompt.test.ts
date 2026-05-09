import { strict as assert } from "node:assert";
import {
  buildQuestBrainPrompt,
  buildQuestBrainPromptContent,
} from "../../src/server/quest/engine/prompt.js";
import {
  getAllowedQuestTransitions,
  initialQuestState,
} from "../../src/server/quest/index.js";

const contentBlocks = buildQuestBrainPromptContent({
  transcript: "Dan, check the door",
  questState: initialQuestState,
  allowedTransitions: getAllowedQuestTransitions(initialQuestState, "en"),
  replyLanguage: "en",
});

assert.equal(contentBlocks.length, 2, "quest prompt has stable and dynamic blocks");
assert.deepEqual(
  contentBlocks[0].cacheControl,
  { type: "ephemeral" },
  "stable prompt block is cache-marked",
);
assert.equal(contentBlocks[1].cacheControl, undefined, "dynamic prompt is not cache-marked");
assert.match(contentBlocks[0].text, /\[Output format\]/u);
assert.match(contentBlocks[0].text, /\[Personas\]/u);
assert.doesNotMatch(contentBlocks[0].text, /Dan, check the door/u);
assert.doesNotMatch(contentBlocks[0].text, /\[Current state\]/u);
assert.match(contentBlocks[1].text, /Dan, check the door/u);
assert.match(contentBlocks[1].text, /\[Current state\]/u);
assert.match(contentBlocks[1].text, /\[Allowed transitions\]/u);
assert.equal(
  buildQuestBrainPrompt({
    transcript: "Dan, check the door",
    questState: initialQuestState,
    allowedTransitions: getAllowedQuestTransitions(initialQuestState, "en"),
    replyLanguage: "en",
  }),
  contentBlocks.map((block) => block.text).join("\n\n"),
  "legacy prompt string remains the joined block text",
);

console.log("prompt.test: passed (10 assertions)");
