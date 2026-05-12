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
assert.equal(introViaPlayer.nextQuestState.sofiaIntroduced, true);
assert.deepEqual(introViaPlayer.nameTagActors, ["sofia", "dan"]);

// Claude trying dan-explained-door on turn 1 is rejected, fallback fires sofia-introduced
const claudeTriesDanFirst = await runTurn({
  transcript: "Дене, де бейдж",
  decision: {
    transitionId: "dan-explained-door",
    actor: "dan",
    reply: "Так, бейдж...",
  },
});
assert.equal(
  claudeTriesDanFirst.event.type,
  "sofia-introduced",
  "turn 1 must be sofia-introduced even when Claude tries to advance",
);

// Phase 1: Dan explains the door situation (had a badge, lost it). No Hoover yet.
const danExplains = await runTurn({
  transcript: "Дене, як вийти",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "dan-explained-door",
    actor: "dan",
    reply: "Ага, двері... у мене був бейдж з кодом, але я його загубив.",
    nameTagActors: ["dan"],
  },
});
assert.equal(danExplains.event.type, "dan-explained-door");
assert.equal(danExplains.nextQuestState.danExplainedDoor, true);
assert.equal(danExplains.nextQuestState.danBadgeAsked, false, "phase 1 does not jump to phase 2");
assert.equal(
  danExplains.nameTagActors.includes("hoover"),
  false,
  "Hoover tag stays hidden after phase 1",
);

// Claude trying dan-badge-asked before phase 1 -> invalid -> fallback fires phase 1
const claudeSkipsPhase1 = await runTurn({
  transcript: "Дене, де бейдж",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "dan-badge-asked",
    actor: "dan",
    reply: "Білий кіт бачив!",
    nameTagActors: ["dan", "hoover"],
  },
});
assert.equal(
  claudeSkipsPhase1.event.type,
  "dan-explained-door",
  "phase 2 cannot fire before phase 1; fallback picks phase 1",
);
assert.equal(claudeSkipsPhase1.nextQuestState.danBadgeAsked, false);

// Stall: between phase 1 and phase 2, asking again without loss-suggestion keeps Dan stalling
const danStalls = await runTurn({
  transcript: "Дене, а де бейдж",
  questState: { sofiaIntroduced: true, danExplainedDoor: true },
  decision: {
    transitionId: "chitchat-replied",
    actor: "dan",
    reply: "Зараз-зараз, я ось-ось знайду його...",
  },
});
assert.equal(danStalls.event.type, "chitchat-replied");
assert.equal(danStalls.actor, "dan");
assert.equal(danStalls.nextQuestState.danBadgeAsked, false, "stall does not advance to phase 2");

// Stall: Claude trying dan-badge-asked without loss-suggestion is rejected -> fallback
const claudeSkipsLossPrompt = await runTurn({
  transcript: "Дене, а де бейдж",
  questState: { sofiaIntroduced: true, danExplainedDoor: true },
  decision: {
    transitionId: "dan-badge-asked",
    actor: "dan",
    reply: "Білий кіт бачив!",
  },
});
assert.notEqual(
  claudeSkipsLossPrompt.event.type,
  "dan-badge-asked",
  "phase 2 only fires on an explicit loss-suggestion",
);

// Phase 2: explicit loss-suggestion unlocks the cat clue and Hoover tag
const danPointsCat = await runTurn({
  transcript: "Дене, може ти його загубив",
  questState: { sofiaIntroduced: true, danExplainedDoor: true },
  decision: {
    transitionId: "dan-badge-asked",
    actor: "dan",
    reply: "Мабуть, ти правий — не можу знайти. Тут білий кіт крутився, спитай у нього.",
    nameTagActors: ["dan", "hoover"],
  },
});
assert.equal(danPointsCat.event.type, "dan-badge-asked");
assert.equal(danPointsCat.nextQuestState.danBadgeAsked, true);
assert.ok(danPointsCat.nameTagActors.includes("hoover"), "Hoover tag appears on phase 2");

// Pre-activation Hoover (after intro, before phase 2) -> Sofia redirect
const preActivationHoover = await runTurn({
  transcript: "Хувере, привіт",
  questState: { sofiaIntroduced: true, danExplainedDoor: true },
  decision: {
    transitionId: "chitchat-replied",
    actor: "hoover",
    reply: "Мяу!",
  },
});
assert.equal(preActivationHoover.event.type, "chitchat-replied");
assert.equal(preActivationHoover.actor, "sofia", "Hoover stays gated even after phase 1");

// Gentle Hoover after phase 2 -> hoover-clue-given
const hooverClue = await runTurn({
  transcript: "Хувере, лагідно, будь ласка",
  questState: { sofiaIntroduced: true, danExplainedDoor: true, danBadgeAsked: true },
  decision: {
    transitionId: "hoover-clue-given",
    actor: "hoover",
    reply: "Мрр. Фіксель забрав бейдж і зробив з нього подушку.",
  },
});
assert.equal(hooverClue.event.type, "hoover-clue-given");
assert.equal(hooverClue.nextQuestState.hooverClueGiven, true);

// Pre-activation Fixel -> Sofia redirect
const preActivationFixel = await runTurn({
  transcript: "Фіксель, прокидайся",
  questState: { sofiaIntroduced: true, danExplainedDoor: true, danBadgeAsked: true },
  decision: {
    transitionId: "chitchat-replied",
    actor: "fixel",
    reply: "мрр.",
  },
});
assert.equal(preActivationFixel.actor, "sofia");

// Fixel wake reveals code, reply forced nonverbal
const fixelWake = await runTurn({
  transcript: "Гей, Фіксель, прокидайся",
  questState: {
    sofiaIntroduced: true,
    danExplainedDoor: true,
    danBadgeAsked: true,
    hooverClueGiven: true,
  },
  decision: {
    transitionId: "code-revealed",
    actor: "fixel",
    reply: "Фіксель перекочується. Бейдж показує код 404.",
  },
});
assert.equal(fixelWake.event.type, "code-revealed");
assert.equal(fixelWake.reply, "мррп.");
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

// Premature door-opened -> fallback safe
const prematureDoor = await runTurn({
  transcript: "Дене, код 404",
  questState: { sofiaIntroduced: true, danExplainedDoor: true, danBadgeAsked: true },
  decision: {
    transitionId: "door-opened",
    actor: "dan",
    reply: "Двері відчинено.",
  },
});
assert.notEqual(prematureDoor.event.type, "door-opened");
assert.equal(prematureDoor.nextQuestState.doorOpen, false);

// door-opened forces the final ritual line
const doorOpened = await runTurn({
  transcript: "Дене, код 404",
  questState: {
    sofiaIntroduced: true,
    danExplainedDoor: true,
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
assert.equal(doorOpened.reply, "Код 404. Двері відчинено. Дякуємо, що були з нами.");

// Invalid JSON on fresh state -> sofia-introduced
const invalidJsonFresh = await runTurn({
  transcript: "привіт",
  decision: "not json",
});
assert.equal(invalidJsonFresh.event.type, "sofia-introduced");

// Invalid JSON post-intro -> chitchat fallback
const invalidJsonPostIntro = await runTurn({
  transcript: "привіт",
  questState: { sofiaIntroduced: true },
  decision: "not json",
});
assert.equal(invalidJsonPostIntro.event.type, "chitchat-replied");
assert.equal(invalidJsonPostIntro.actor, "sofia");

// Leaked code 404 before code-revealed -> falls back safely
const prematureFixelCode = await runTurn({
  transcript: "Фіксель, дай код",
  questState: {
    sofiaIntroduced: true,
    danExplainedDoor: true,
    danBadgeAsked: true,
    hooverClueGiven: true,
  },
  decision: {
    transitionId: "code-revealed",
    actor: "fixel",
    reply: "Код 404.",
  },
});
assert.equal(prematureFixelCode.event.type, "fixel-sleeping-rejected");
assert.doesNotMatch(prematureFixelCode.reply, /404/u);

// Sofiia mentioning Hoover before phase 2 is blocked -> canned hint
const earlySofiaHoover = await runTurn({
  transcript: "Софія, дай підказку",
  questState: { sofiaIntroduced: true, danExplainedDoor: true },
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Поговори з Hoover.",
    nameTagActors: ["sofia", "hoover"],
  },
});
assert.equal(earlySofiaHoover.event.type, "sofia-hint-given");
assert.equal(
  earlySofiaHoover.reply,
  "Він уже хвилин п'ять шукає. Спробуй просто запитати, чи він часом не загубив його — може, тоді нарешті визнає.",
  "early Hoover leak replaced by dan-explained canned hint nudging toward loss-suggestion",
);
assert.equal(earlySofiaHoover.nameTagActors.includes("hoover"), false);

// Sofiia mentioning Fixel before Hoover clue -> blocked
const earlySofiaFixel = await runTurn({
  transcript: "Софія, що далі",
  questState: { sofiaIntroduced: true, danExplainedDoor: true, danBadgeAsked: true },
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Fixel сховав бейдж.",
    nameTagActors: ["sofia", "fixel"],
  },
});
assert.equal(earlySofiaFixel.event.type, "sofia-hint-given");
assert.equal(
  earlySofiaFixel.reply,
  "Якщо Ден на когось показав — звернись до нього без тиску. Коти не дуже на накази.",
);
assert.equal(earlySofiaFixel.nameTagActors.includes("fixel"), false);

// Unaddressed help -> chitchat fallback
const unaddressedHelp = await runTurn({
  transcript: "чи є ідеї",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "sofia-hint-given",
    actor: "sofia",
    reply: "Спробуй почати з Дена.",
  },
});
assert.equal(unaddressedHelp.event.type, "chitchat-replied");
assert.equal(unaddressedHelp.actor, "sofia");

// English: phase 1 + phase 2
const englishPhase1 = await runTurn({
  transcript: "Dan, can you open the door?",
  questState: { sofiaIntroduced: true },
  decision: {
    transitionId: "dan-explained-door",
    actor: "dan",
    reply: "Ah, the door... I had a badge but I can't find it.",
  },
});
assert.equal(englishPhase1.event.type, "dan-explained-door");

const englishPhase2 = await runTurn({
  transcript: "Dan, maybe you lost it?",
  questState: { sofiaIntroduced: true, danExplainedDoor: true },
  decision: {
    transitionId: "dan-badge-asked",
    actor: "dan",
    reply: "Ah, you might be right — the white cat was circling me.",
  },
});
assert.equal(englishPhase2.event.type, "dan-badge-asked");

// English: door-opened
const englishDoor = await createQuestBrainTurn({
  transcript: "Dan, code 404",
  questState: {
    sofiaIntroduced: true,
    danExplainedDoor: true,
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

console.log("brain.test: passed (42 assertions)");
