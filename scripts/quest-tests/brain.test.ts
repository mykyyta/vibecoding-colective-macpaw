import { strict as assert } from "node:assert";
import type { QuestState } from "../../src/shared/voice.js";
import { createQuestBrainTurn } from "../../src/server/quest/engine/brain.js";
import { getQuestSoundEffect } from "../../src/server/quest/engine/sound-effects.js";
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
    reply: "Я б почала з Dan біля дверної панелі.",
    nameTagActors: ["sofia", "dan"],
  },
});
assert.equal(sofiaHint.event.type, "sofia-hint-given");
assert.equal(sofiaHint.actor, "sofia");
assert.equal(sofiaHint.nextQuestState.danDoorChecked, false, "sofia-hint-given does not advance state");
assert.deepEqual(sofiaHint.nameTagActors, ["sofia", "dan"], "Claude name tag decision is preserved for allowed names");

// Valid Dan door check -> state advances
const danDoor = await runTurn({
  transcript: "Dan, can you check the door?",
  decision: {
    transitionId: "dan-door-checked",
    actor: "dan",
    reply: "Looks like a code lock. Hoover was hanging around near the door.",
    nameTagActors: ["dan", "hoover"],
  },
});
assert.equal(danDoor.event.type, "dan-door-checked");
assert.equal(danDoor.nextQuestState.danDoorChecked, true);
assert.deepEqual(danDoor.nameTagActors, ["dan", "hoover"], "Hoover tag may appear when Dan checks the door");

// Valid gentle Hoover -> Hoover clue
const hooverClue = await runTurn({
  transcript: "Hoover, sweet cat, please help",
  questState: {
    danDoorChecked: true,
  },
  decision: {
    transitionId: "hoover-clue-given",
    actor: "hoover",
    reply: "Mrr. Fixel took the badge and made it a pillow.",
  },
});
assert.equal(hooverClue.event.type, "hoover-clue-given");
assert.equal(hooverClue.nextQuestState.hooverClueGiven, true);

// Valid Fixel wake -> code-revealed
const fixelWake = await runTurn({
  transcript: "Гей, Фіксель, прокидайся",
  questState: {
    danDoorChecked: true,
    hooverClueGiven: true,
  },
  decision: {
    transitionId: "code-revealed",
    actor: "fixel",
    reply: "Fixel rolls over. The badge shows code 404.",
  },
});
assert.equal(fixelWake.event.type, "code-revealed");
assert.equal(fixelWake.nextQuestState.codeRevealed, true);
assert.equal(fixelWake.reply, "мррп.", "Fixel wake reply is forced to nonverbal output");
assert.deepEqual(
  getQuestSoundEffect({
    actor: fixelWake.actor,
    eventType: fixelWake.event.type,
    language: fixelWake.replyLanguage,
  }),
  {
    assetUrl: "/audio/fixel-wake-mrrp.mp3",
    fallbackText: "мррп.",
    id: "fixel-wake-mrrp",
    provider: "asset",
  },
  "Fixel wake maps to local SFX asset",
);

// Invalid door-opened when state isn't ready -> fallback stays safe
const prematureDoor = await runTurn({
  transcript: "Dan, code 404",
  questState: {
    danDoorChecked: true,
  },
  decision: {
    transitionId: "door-opened",
    actor: "dan",
    reply: "Code 404. Door open. Thanks for being with us.",
  },
});
assert.notEqual(prematureDoor.event.type, "door-opened", "premature door-opened falls back");
assert.equal(prematureDoor.nextQuestState.doorOpen, false);

// door-opened reply forced to final line regardless of Claude reply
const doorOpened = await runTurn({
  transcript: "Dan, code 404",
  questState: {
    danDoorChecked: true,
    hooverClueGiven: true,
    codeRevealed: true,
  },
  decision: {
    transitionId: "door-opened",
    actor: "dan",
    reply: "The door swings open wide!",
  },
});
assert.equal(doorOpened.event.type, "door-opened");
assert.equal(doorOpened.reply, "Код 404. Двері відчинено. Дякуємо, що були з нами.", "door reply forced to final Dan line");
assert.equal(doorOpened.nextQuestState.doorOpen, true);

// Invalid JSON from Claude -> fallback turn (Sofiia default context)
const invalidJson = await runTurn({
  transcript: "привіт",
  decision: "not json",
});
assert.equal(invalidJson.event.type, "chitchat-replied", "invalid JSON -> fallback");
assert.equal(invalidJson.actor, "sofia");

// Reply with leaked code 404 before code-revealed -> invalid transition falls back safely
const prematureFixelCode = await runTurn({
  transcript: "Фіксель, дай код",
  questState: {
    danDoorChecked: true,
    hooverClueGiven: true,
  },
  decision: {
    transitionId: "code-revealed",
    actor: "fixel",
    reply: "Код 404.",
  },
});
assert.equal(prematureFixelCode.event.type, "fixel-sleeping-rejected", "premature code-revealed falls to fallback");
assert.equal(prematureFixelCode.nextQuestState.codeRevealed, false);
assert.doesNotMatch(prematureFixelCode.reply, /404/u, "fallback reply has no 404");

// Early Sofiia mention of Hoover is blocked before Dan checks the door
const earlySofiaHoover = await runTurn({
  transcript: "Софія, дай підказку",
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Поговори з Hoover біля дверей.",
    nameTagActors: ["sofia", "hoover"],
  },
});
assert.equal(earlySofiaHoover.event.type, "sofia-hint-given");
assert.equal(
  earlySofiaHoover.reply,
  "Я б почала з Dan. Він ближче до дверної панелі й може зрозуміти, що саме заблоковано.",
  "early Hoover leak replaced by canned Sofiia hint",
);
assert.deepEqual(earlySofiaHoover.nameTagActors, ["sofia"], "Hoover tag is gated before Dan checks the door");

// Early Sofiia mention of Fixel/badge is blocked after Dan but before Hoover clue
const earlySofiaFixel = await runTurn({
  transcript: "Софія, що далі",
  questState: {
    danDoorChecked: true,
  },
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Fixel сховав бейдж під собою.",
    nameTagActors: ["sofia", "fixel"],
  },
});
assert.equal(earlySofiaFixel.event.type, "sofia-hint-given");
assert.equal(
  earlySofiaFixel.reply,
  "Dan дав напрям. Спробуй звернутися до Hoover спокійно й без тиску.",
  "early Fixel/badge leak replaced by canned Sofiia hint",
);
assert.deepEqual(earlySofiaFixel.nameTagActors, ["sofia"], "Fixel tag is gated before Hoover clue");

// Unaddressed sofia-hint (no direct Sofia address) -> illegal, fallback
const unaddressedHelp = await runTurn({
  transcript: "чи є ідеї",
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй почати з Dan.",
  },
});
assert.equal(unaddressedHelp.event.type, "chitchat-replied", "unaddressed help not a sofia-hint");
assert.equal(unaddressedHelp.actor, "sofia");

// Chitchat reply with leaked Fixel name early -> guardrail fires, canned fallback
const fixelNameLeak = await runTurn({
  transcript: "котику, як тебе звати",
  decision: {
    transitionId: "chitchat-replied",
    actor: "fixel",
    reply: "Мене звати Fixel.",
  },
});
assert.equal(fixelNameLeak.event.type, "chitchat-replied");
assert.equal(fixelNameLeak.actor, "fixel");
assert.equal(fixelNameLeak.reply, "мрр...", "name leak blocked, nonverbal Fixel fallback used");

// English: Dan door check
const englishDan = await runTurn({
  transcript: "Dan, check the door",
  decision: {
    transitionId: "dan-door-checked",
    actor: "dan",
    reply: "Looks like a code lock. Hoover was near the door.",
  },
});
assert.equal(englishDan.event.type, "dan-door-checked");

// English: door-opened
const englishDoor = await createQuestBrainTurn({
  transcript: "Dan, code 404",
  questState: {
    danDoorChecked: true,
    hooverClueGiven: true,
    codeRevealed: true,
  },
  replyLanguage: "en",
  getClaudeProvider: () =>
    fakeClaudeDecision({
      transitionId: "door-opened",
      actor: "dan",
      reply: "Door opens.",
    }),
});
assert.equal(englishDoor.event.type, "door-opened");
assert.equal(englishDoor.reply, "Code 404. Door open. Thanks for being with us.");
assert.equal(englishDoor.nextQuestState.doorOpen, true);

console.log("brain.test: passed (28 assertions)");
