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

// On a fresh session, sofia-introduced fires regardless of who the player addressed
const introViaPlayer = await runTurn({
  transcript: "Дене, відчини двері",
  decision: {
    transitionId: "sofia-introduced",
    actor: "sofia",
    reply: "Привіт, я Софія. Це Ден. Двері заблоковані...",
    nameTagActors: ["sofia", "dan"],
  },
});
assert.equal(introViaPlayer.event.type, "sofia-introduced", "first turn fires sofia-introduced");
assert.equal(introViaPlayer.actor, "sofia");
assert.equal(introViaPlayer.nextQuestState.sofiaIntroduced, true, "intro advances sofiaIntroduced");
assert.deepEqual(
  introViaPlayer.nameTagActors,
  ["sofia", "dan"],
  "intro reveals Sofiia and Dan name tags",
);

// If Claude tries to fire dan-badge-asked on turn 1, parser/validator rejects -> fallback sofia-introduced
const claudeTriesDanFirst = await runTurn({
  transcript: "Дене, де бейдж",
  decision: {
    transitionId: "dan-badge-asked",
    actor: "dan",
    reply: "О, бейдж? Я десь його поклав. Хувер тут крутився.",
    nameTagActors: ["dan", "hoover"],
  },
});
assert.equal(
  claudeTriesDanFirst.event.type,
  "sofia-introduced",
  "first turn must be sofia-introduced even when Claude tries dan-badge-asked",
);
assert.equal(claudeTriesDanFirst.actor, "sofia");

// Post-intro Sofia hint passes through
const sofiaHint = await runTurn({
  transcript: "Софія, чи є ідеї",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Я б почала з Дена — він був із бейджиком.",
    nameTagActors: ["sofia", "dan"],
  },
});
assert.equal(sofiaHint.event.type, "sofia-hint-given");
assert.equal(sofiaHint.nextQuestState.danBadgeAsked, false, "sofia-hint-given does not advance state");
assert.deepEqual(sofiaHint.nameTagActors, ["sofia", "dan"]);

// Dan badge ask after intro -> advances state
const danBadge = await runTurn({
  transcript: "Дене, де твій бейдж",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "dan-badge-asked",
    actor: "dan",
    reply: "О, бейдж? Я десь його поклав. Тут весь час білий кіт крутився.",
    nameTagActors: ["dan", "hoover"],
  },
});
assert.equal(danBadge.event.type, "dan-badge-asked");
assert.equal(danBadge.nextQuestState.danBadgeAsked, true);
assert.deepEqual(danBadge.nameTagActors, ["dan", "hoover"], "Hoover tag reveals when Dan is asked");

// Pre-activation Hoover address (after intro, before dan-badge-asked) -> chitchat actor must be sofia
const preActivationHoover = await runTurn({
  transcript: "Хувере, привіт",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "chitchat-replied",
    actor: "hoover",
    reply: "Мяу!",
    nameTagActors: ["hoover"],
  },
});
assert.equal(preActivationHoover.event.type, "chitchat-replied");
assert.notEqual(
  preActivationHoover.actor,
  "hoover",
  "pre-activation Hoover address must not produce a Hoover reply",
);
assert.equal(
  preActivationHoover.actor,
  "sofia",
  "pre-activation Hoover address redirects to Sofia",
);

// Gentle Hoover after Dan -> Hoover clue
const hooverClue = await runTurn({
  transcript: "Хувере, лагідно, будь ласка, допоможи",
  questState: { sofiaIntroduced: true, danBadgeAsked: true },
  decision: {
    transitionId: "hoover-clue-given",
    actor: "hoover",
    reply: "Мрр. Фіксель забрав бейдж і зробив з нього подушку.",
  },
});
assert.equal(hooverClue.event.type, "hoover-clue-given");
assert.equal(hooverClue.nextQuestState.hooverClueGiven, true);

// Pre-activation Fixel address -> chitchat actor must be sofia
const preActivationFixel = await runTurn({
  transcript: "Фіксель, прокидайся",
  questState: { sofiaIntroduced: true, danBadgeAsked: true },
  decision: {
    transitionId: "chitchat-replied",
    actor: "fixel",
    reply: "мрр.",
  },
});
assert.equal(preActivationFixel.event.type, "chitchat-replied");
assert.equal(
  preActivationFixel.actor,
  "sofia",
  "pre-activation Fixel address redirects to Sofia",
);

// Fixel wake -> code revealed, reply forced nonverbal
const fixelWake = await runTurn({
  transcript: "Гей, Фіксель, прокидайся",
  questState: { sofiaIntroduced: true, danBadgeAsked: true, hooverClueGiven: true },
  decision: {
    transitionId: "code-revealed",
    actor: "fixel",
    reply: "Фіксель перекочується. Бейдж показує код 404.",
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
);

// Premature door-opened when state isn't ready -> fallback stays safe
const prematureDoor = await runTurn({
  transcript: "Дене, код 404",
  questState: { sofiaIntroduced: true, danBadgeAsked: true },
  decision: {
    transitionId: "door-opened",
    actor: "dan",
    reply: "Код 404. Двері відчинено. Дякуємо, що були з нами.",
  },
});
assert.notEqual(prematureDoor.event.type, "door-opened", "premature door-opened falls back");
assert.equal(prematureDoor.nextQuestState.doorOpen, false);

// door-opened reply forced to final line regardless of Claude reply
const doorOpened = await runTurn({
  transcript: "Дене, код 404",
  questState: {
    sofiaIntroduced: true,
    danBadgeAsked: true,
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
assert.equal(
  doorOpened.reply,
  "Код 404. Двері відчинено. Дякуємо, що були з нами.",
  "door reply forced to final Dan line",
);
assert.equal(doorOpened.nextQuestState.doorOpen, true);

// Invalid JSON from Claude on fresh state -> fallback fires sofia-introduced
const invalidJsonFresh = await runTurn({
  transcript: "привіт",
  decision: "not json",
});
assert.equal(
  invalidJsonFresh.event.type,
  "sofia-introduced",
  "invalid JSON on turn 1 falls back to sofia-introduced",
);

// Invalid JSON post-intro -> chitchat fallback
const invalidJsonPostIntro = await runTurn({
  transcript: "привіт",
  questState: { sofiaIntroduced: true },
  decision: "not json",
});
assert.equal(invalidJsonPostIntro.event.type, "chitchat-replied", "invalid JSON post-intro -> chitchat");
assert.equal(invalidJsonPostIntro.actor, "sofia");

// Reply with leaked code 404 before code-revealed -> invalid transition falls back safely
const prematureFixelCode = await runTurn({
  transcript: "Фіксель, дай код",
  questState: { sofiaIntroduced: true, danBadgeAsked: true, hooverClueGiven: true },
  decision: {
    transitionId: "code-revealed",
    actor: "fixel",
    reply: "Код 404.",
  },
});
assert.equal(prematureFixelCode.event.type, "fixel-sleeping-rejected", "premature code-revealed falls to fallback");
assert.equal(prematureFixelCode.nextQuestState.codeRevealed, false);
assert.doesNotMatch(prematureFixelCode.reply, /404/u, "fallback reply has no 404");

// Sofiia mentioning Hoover before dan-badge-asked is blocked by guardrail
const earlySofiaHoover = await runTurn({
  transcript: "Софія, дай підказку",
  questState: { sofiaIntroduced: true },
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
  "Я б почала з Дена. Він був із бейджиком і точно пам'ятає більше, ніж вдає.",
  "early Hoover leak replaced by canned Sofiia hint",
);
assert.deepEqual(earlySofiaHoover.nameTagActors, ["sofia"], "Hoover tag is gated before Dan is asked");

// Sofiia mentioning Fixel before Hoover clue is blocked by guardrail
const earlySofiaFixel = await runTurn({
  transcript: "Софія, що далі",
  questState: { sofiaIntroduced: true, danBadgeAsked: true },
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
  "Якщо Ден на когось показав — звернись до нього без тиску. Коти не дуже на накази.",
  "early Fixel leak replaced by canned Sofiia hint",
);
assert.deepEqual(earlySofiaFixel.nameTagActors, ["sofia"], "Fixel tag is gated before Hoover clue");

// Unaddressed help -> illegal sofia-hint, fallback to chitchat
const unaddressedHelp = await runTurn({
  transcript: "чи є ідеї",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй почати з Дена.",
  },
});
assert.equal(unaddressedHelp.event.type, "chitchat-replied", "unaddressed help not a sofia-hint");
assert.equal(unaddressedHelp.actor, "sofia");

// English: Dan badge ask
const englishDan = await runTurn({
  transcript: "Dan, where is your badge?",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "dan-badge-asked",
    actor: "dan",
    reply: "Oh, the badge? I put it down somewhere. The white cat was right here.",
  },
});
assert.equal(englishDan.event.type, "dan-badge-asked");

// English: door-opened
const englishDoor = await createQuestBrainTurn({
  transcript: "Dan, code 404",
  questState: {
    sofiaIntroduced: true,
    danBadgeAsked: true,
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

console.log("brain.test: passed (37 assertions)");
