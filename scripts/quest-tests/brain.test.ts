import { strict as assert } from "node:assert";
import type { QuestState } from "../../src/shared/voice.js";
import { createQuestBrainTurn } from "../../src/server/quest/brain.js";
import { initialQuestState } from "../../src/server/quest/index.js";
import { fakeClaudeFromText, fakeClaudeDecision, type FakeDecision } from "./fake-claude.js";

async function runTurn({
  transcript,
  questState = initialQuestState,
  decision,
}: {
  transcript: string;
  questState?: Partial<QuestState>;
  decision: FakeDecision | string;
}) {
  const provider =
    typeof decision === "string"
      ? fakeClaudeFromText(decision)
      : fakeClaudeDecision(decision);

  return createQuestBrainTurn({
    transcript,
    questState,
    getClaudeProvider: () => provider,
  });
}

// Valid sofia-hint-given decision -> returns turn with state preserved
const sofiaHint = await runTurn({
  transcript: "Софія, чи є ідеї",
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй почати зі знайомства з людиною біля дверей.",
  },
});
assert.equal(sofiaHint.event.type, "sofia-hint-given");
assert.equal(sofiaHint.actor, "sofia");
assert.equal(sofiaHint.nextQuestState.olegNameKnown, false, "sofia-hint-given does not advance state");

// Valid oleg-name-learned -> state advances
const guardName = await runTurn({
  transcript: "Як вас звати?",
  decision: {
    transitionId: "oleg-name-learned",
    actor: "guard",
    reply: "Я Олег. Тут навіть двері питають ім'я перед доступом.",
  },
});
assert.equal(guardName.event.type, "oleg-name-learned");
assert.equal(guardName.nextQuestState.olegNameKnown, true);

// Valid pixel + purr -> code-revealed
const pixelPurr = await runTurn({
  transcript: "Pixel, мрр",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    transitionId: "code-revealed",
    actor: "pixel",
    reply: "Мрр. Код 404, нарешті людський prompt став котячим.",
  },
});
assert.equal(pixelPurr.event.type, "code-revealed");
assert.equal(pixelPurr.nextQuestState.codeRevealed, true);

// Invalid door-opened when state isn't ready -> fallback to heuristic
// (heuristic finds guard-hint-given: hasOleg + hasDoor both true for "Олег, код 404" with olegNameKnown)
const prematureDoor = await runTurn({
  transcript: "Олег, код 404",
  questState: {
    olegNameKnown: true,
  },
  decision: {
    transitionId: "door-opened",
    actor: "door",
    reply: "404 accepted. Door not found, but exit found.",
  },
});
assert.equal(prematureDoor.event.type, "guard-hint-given", "premature door-opened falls back to heuristic");
assert.equal(prematureDoor.nextQuestState.doorOpen, false);

// door-opened reply forced to FINAL_DOOR_LINE regardless of Claude reply
const doorOpened = await runTurn({
  transcript: "Олег, код 404",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
    codeRevealed: true,
  },
  decision: {
    transitionId: "door-opened",
    actor: "door",
    reply: "The door swings open wide!",
  },
});
assert.equal(doorOpened.event.type, "door-opened");
assert.equal(doorOpened.reply, "404 accepted. Door not found, but exit found.", "door reply forced to FINAL_DOOR_LINE");
assert.equal(doorOpened.nextQuestState.doorOpen, true);

// Invalid JSON from Claude -> fallback turn (chitchat)
const invalidJson = await runTurn({
  transcript: "привіт",
  decision: "not json",
});
assert.equal(invalidJson.event.type, "chitchat-replied", "invalid JSON -> fallback");
assert.equal(invalidJson.actor, "guard");

// Reply with leaked code 404 before code-revealed -> guardrail fires, per-transition fallback
const prematurePixelCode = await runTurn({
  transcript: "Піксель, дай код",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    transitionId: "code-revealed",
    actor: "pixel",
    reply: "Код 404.",
  },
});
// factsCheck for code-revealed requires hasPurr, which "дай код" does not have
// So validateDecision marks it illegal -> fallback
assert.equal(prematurePixelCode.event.type, "pixel-ordinary-rejected", "premature code-revealed falls to fallback");
assert.equal(prematurePixelCode.nextQuestState.codeRevealed, false);
assert.doesNotMatch(prematurePixelCode.reply, /404/u, "fallback reply has no 404");

// Premature cat language hint from Sofia is blocked
const prematureSofiaCat = await runTurn({
  transcript: "Софія, що думаєш",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
  },
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй говорити з Pixel його мовою, наприклад муркнути.",
  },
});
assert.equal(prematureSofiaCat.event.type, "sofia-hint-given");
assert.equal(
  prematureSofiaCat.reply,
  "Олег уже дав напрям. Я б просто звернулася до Pixel і спробувала поговорити з ним спокійно, без тиску.",
  "premature cat hint replaced by canned reply",
);

// Unaddressed sofia-hint (no direct sofia address) -> illegal, fallback
const unaddressedHelp = await runTurn({
  transcript: "чи є ідеї",
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй почати з людини біля дверей.",
  },
});
assert.equal(unaddressedHelp.event.type, "chitchat-replied", "unaddressed help not a sofia-hint");

// Chitchat reply with leaked pixel name early -> guardrail fires, canned fallback
const catNameLeak = await runTurn({
  transcript: "котику, як тебе звати",
  decision: {
    transitionId: "chitchat-replied",
    actor: "pixel",
    reply: "Мене звати Pixel.",
  },
});
assert.equal(catNameLeak.event.type, "chitchat-replied");
assert.equal(catNameLeak.reply, "Мр. Я не техпідтримка, я атмосфера з хвостом.", "name leak blocked, chitchat fallback used");

// English: guard name learned
const englishGuardName = await runTurn({
  transcript: "What is your name?",
  decision: {
    transitionId: "oleg-name-learned",
    actor: "guard",
    reply: "I'm Oleg. Even the door prefers introductions before access.",
  },
});
assert.equal(englishGuardName.event.type, "oleg-name-learned");

// English: door-opened
const englishDoor = await runTurn({
  transcript: "Oleg, code 404",
  questState: {
    olegNameKnown: true,
    guardHintGiven: true,
    codeRevealed: true,
  },
  decision: {
    transitionId: "door-opened",
    actor: "door",
    reply: "404 accepted. Door not found, but exit found.",
  },
});
assert.equal(englishDoor.event.type, "door-opened");
assert.equal(englishDoor.nextQuestState.doorOpen, true);

console.log("brain.test: passed (16 assertions)");
