import { strict as assert } from "node:assert";
import {
  getAllowedQuestTransitions,
  isTransitionLegal,
} from "../../src/server/quest/index.js";
import type { QuestState } from "../../src/shared/voice.js";
import { analyzeQuestTranscript } from "../../src/server/quest/index.js";

const fresh: QuestState = {
  sofiaIntroduced: false,
  danBadgeAsked: false,
  hooverClueGiven: false,
  codeRevealed: false,
  doorOpen: false,
};

const introduced: QuestState = { ...fresh, sofiaIntroduced: true };
const danAsked: QuestState = { ...introduced, danBadgeAsked: true };
const hooverClue: QuestState = { ...danAsked, hooverClueGiven: true };
const codeRevealed: QuestState = { ...hooverClue, codeRevealed: true };
const doorOpen: QuestState = { ...codeRevealed, doorOpen: true };

// First turn: only sofia-introduced is available, nothing else
const freshAllowed = getAllowedQuestTransitions(fresh, "uk");
assert.equal(freshAllowed.length, 1, "only one transition available before intro");
assert.equal(freshAllowed[0].id, "sofia-introduced", "first turn must be sofia-introduced");
assert.equal(freshAllowed.find((t) => t.id === "chitchat-replied"), undefined, "no chitchat before intro");
assert.equal(freshAllowed.find((t) => t.id === "sofia-hint-given"), undefined, "no hint before intro");
assert.equal(freshAllowed.find((t) => t.id === "dan-badge-asked"), undefined, "no Dan trigger before intro");

// After intro: sofia-introduced is gone, chitchat and hint are back
const introducedAllowed = getAllowedQuestTransitions(introduced, "uk");
assert.equal(introducedAllowed.find((t) => t.id === "sofia-introduced"), undefined, "sofia-introduced fires once");
assert.ok(introducedAllowed.find((t) => t.id === "chitchat-replied"), "chitchat available after intro");
assert.ok(introducedAllowed.find((t) => t.id === "sofia-hint-given"), "sofia-hint-given available after intro");

// dan-badge-asked available only after intro and before danBadgeAsked
assert.ok(introducedAllowed.find((t) => t.id === "dan-badge-asked"), "dan-badge-asked available after intro");
const danAskedAllowed = getAllowedQuestTransitions(danAsked, "uk");
assert.equal(danAskedAllowed.find((t) => t.id === "dan-badge-asked"), undefined, "dan-badge-asked fires once");

// Hoover transitions available only after Dan was asked and before Hoover clue
assert.equal(introducedAllowed.find((t) => t.id === "hoover-clue-given"), undefined, "no Hoover clue before Dan");
assert.ok(danAskedAllowed.find((t) => t.id === "hoover-clue-given"), "hoover-clue-given available after Dan");
assert.ok(danAskedAllowed.find((t) => t.id === "hoover-ordinary-rejected"), "hoover rejection available after Dan");
const hooverAllowed = getAllowedQuestTransitions(hooverClue, "uk");
assert.equal(hooverAllowed.find((t) => t.id === "hoover-clue-given"), undefined, "hoover-clue-given fires once");

// Fixel and code transitions available after Hoover clue
assert.ok(hooverAllowed.find((t) => t.id === "code-revealed"), "code-revealed available after Hoover clue");
assert.ok(hooverAllowed.find((t) => t.id === "fixel-sleeping-rejected"), "Fixel rejection available after Hoover clue");
const codeAllowed = getAllowedQuestTransitions(codeRevealed, "uk");
assert.equal(codeAllowed.find((t) => t.id === "code-revealed"), undefined, "code-revealed fires once");

// door-opened available after code reveal
assert.ok(codeAllowed.find((t) => t.id === "door-opened"), "door-opened available after code reveal");
const doorAllowed = getAllowedQuestTransitions(doorOpen, "uk");
assert.equal(doorAllowed.find((t) => t.id === "door-opened"), undefined, "door-opened fires once");

// isTransitionLegal: sofia-introduced is legal exactly on a fresh state
assert.equal(isTransitionLegal("sofia-introduced", fresh, analyzeQuestTranscript("привіт")), true);
assert.equal(isTransitionLegal("sofia-introduced", introduced, analyzeQuestTranscript("привіт")), false);

// isTransitionLegal: dan-badge-asked needs intro fired
const danDoor = analyzeQuestTranscript("Дене, де твій бейдж");
assert.equal(isTransitionLegal("dan-badge-asked", fresh, danDoor), false, "Dan not addressable before intro");
assert.equal(isTransitionLegal("dan-badge-asked", introduced, danDoor), true);
assert.equal(isTransitionLegal("dan-badge-asked", danAsked, danDoor), false);

// isTransitionLegal: Hoover gentle clue needs Dan asked first
const hooverGentle = analyzeQuestTranscript("Хувере, лагідно, будь ласка, допоможи");
assert.equal(isTransitionLegal("hoover-clue-given", danAsked, hooverGentle), true);
assert.equal(isTransitionLegal("hoover-clue-given", introduced, hooverGentle), false);

// isTransitionLegal: Hoover ordinary rejection
const hooverRough = analyzeQuestTranscript("Хувере, дай код");
assert.equal(isTransitionLegal("hoover-ordinary-rejected", danAsked, hooverRough), true);
assert.equal(isTransitionLegal("hoover-clue-given", danAsked, hooverRough), false);

// isTransitionLegal: Fixel wake reveals code
const fixelWake = analyzeQuestTranscript("Гей, Фіксель, прокидайся");
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelWake), true);
assert.equal(isTransitionLegal("code-revealed", danAsked, fixelWake), false);

// isTransitionLegal: Fixel plain request does not reveal code
const fixelPlain = analyzeQuestTranscript("Фіксель, дай код");
assert.equal(isTransitionLegal("fixel-sleeping-rejected", hooverClue, fixelPlain), true);
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelPlain), false);

// isTransitionLegal: door-opened requires Dan + revealed 404
const danCode = analyzeQuestTranscript("Дене, код 404");
assert.equal(isTransitionLegal("door-opened", codeRevealed, danCode), true);
assert.equal(isTransitionLegal("door-opened", hooverClue, danCode), false);

// sofia-hint-given requires direct Sofia address + hint intent + intro fired
const sofiaHint = analyzeQuestTranscript("Софіє, дай підказку");
assert.equal(isTransitionLegal("sofia-hint-given", fresh, sofiaHint), false, "hint requires intro");
assert.equal(isTransitionLegal("sofia-hint-given", introduced, sofiaHint), true);
const unaddressedHelp = analyzeQuestTranscript("дай підказку");
assert.equal(isTransitionLegal("sofia-hint-given", introduced, unaddressedHelp), false);

console.log("transitions.test: passed (36 assertions)");
