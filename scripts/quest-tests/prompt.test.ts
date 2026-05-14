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
assert.match(contentBlocks[0].text, /Required facts, fresh wording/u);
assert.match(contentBlocks[0].text, /Dan accepts he cannot find the badge/u);
assert.doesNotMatch(contentBlocks[0].text, /дамп пам/u);
assert.doesNotMatch(contentBlocks[0].text, /memory dump/u);
assert.doesNotMatch(contentBlocks[0].text, /оптимізував/u);
assert.doesNotMatch(contentBlocks[0].text, /Dan, check the door/u);
assert.doesNotMatch(contentBlocks[0].text, /\[Current state\]/u);
assert.match(contentBlocks[1].text, /Dan, check the door/u);
assert.match(contentBlocks[1].text, /\[Current state\]/u);
assert.match(contentBlocks[1].text, /\[Allowed transitions\]/u);
assert.match(contentBlocks[1].text, /\[Decision guide for this turn\]/u);
assert.match(contentBlocks[1].text, /Ordinary greetings, reactions, jokes/u);
assert.match(contentBlocks[1].text, /bare character name or greeting/u);
assert.match(contentBlocks[1].text, /asking for what to do/u);
assert.match(contentBlocks[1].text, /Do NOT choose sofia-hint-given for ordinary conversation/u);
assert.match(contentBlocks[1].text, /Non-hint examples/u);
assert.match(contentBlocks[1].text, /Hoover or Fixel and the player's attempt/u);
assert.match(contentBlocks[1].text, /not a generic fallback/u);
assert.match(contentBlocks[1].text, /ну давай будь ласка/u);
assert.match(contentBlocks[1].text, /прокидайся вже/u);
assert.match(contentBlocks[1].text, /Do not use imperative or suggestion wording/u);
assert.match(contentBlocks[1].text, /Do not name the missing/u);
assert.match(contentBlocks[1].text, /closed observation, not a question/u);
assert.match(contentBlocks[1].text, /If unsure between a hint and chitchat/u);
assert.match(contentBlocks[1].text, /Do not copy persona examples/u);
assert.match(contentBlocks[1].text, /For Dan chitchat/u);

const stallHintBlocks = buildQuestBrainPromptContent({
  transcript: "що мені робити?",
  questState: { ...initialQuestState, sofiaIntroduced: true, danExplainedDoor: true },
  allowedTransitions: getAllowedQuestTransitions(
    { ...initialQuestState, sofiaIntroduced: true, danExplainedDoor: true },
    "uk",
  ),
  replyLanguage: "uk",
});
assert.match(
  stallHintBlocks[1].text,
  /Sofiia's hint should be direct and should include a concrete example question/u,
);
assert.match(stallHintBlocks[1].text, /Дене, може, ти загубив бейдж/u);

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

console.log("prompt.test: passed (31 assertions)");
