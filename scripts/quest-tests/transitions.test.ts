import { strict as assert } from "node:assert";
import {
  getAllowedQuestTransitions,
  isTransitionLegal,
} from "../../src/server/quest/index.js";
import type { QuestState } from "../../src/shared/voice.js";
import { analyzeQuestTranscript } from "../../src/server/quest/index.js";

const initial: QuestState = {
  danBadgeAsked: false,
  hooverClueGiven: false,
  codeRevealed: false,
  doorOpen: false,
};

const danChecked: QuestState = { ...initial, danBadgeAsked: true };
const hooverClue: QuestState = { ...danChecked, hooverClueGiven: true };
const codeRevealed: QuestState = { ...hooverClue, codeRevealed: true };
const doorOpen: QuestState = { ...codeRevealed, doorOpen: true };

// chitchat-replied is always available
const initialAllowed = getAllowedQuestTransitions(initial, "uk");
assert.ok(initialAllowed.find((t) => t.id === "chitchat-replied"), "chitchat-replied always available");

// sofia-hint-given is always available but requires facts to be legal
assert.ok(initialAllowed.find((t) => t.id === "sofia-hint-given"), "sofia-hint-given available");

// dan-badge-asked available only before danBadgeAsked
assert.ok(initialAllowed.find((t) => t.id === "dan-badge-asked"), "dan-badge-asked available at initial");
const danCheckedAllowed = getAllowedQuestTransitions(danChecked, "uk");
assert.equal(danCheckedAllowed.find((t) => t.id === "dan-badge-asked"), undefined);

// Hoover transitions available only after Dan checked door and before Hoover clue
assert.equal(initialAllowed.find((t) => t.id === "hoover-clue-given"), undefined);
assert.ok(danCheckedAllowed.find((t) => t.id === "hoover-clue-given"), "hoover-clue-given available after Dan");
assert.ok(danCheckedAllowed.find((t) => t.id === "hoover-ordinary-rejected"), "hoover rejection available after Dan");
const hooverAllowed = getAllowedQuestTransitions(hooverClue, "uk");
assert.equal(hooverAllowed.find((t) => t.id === "hoover-clue-given"), undefined);

// Fixel/code transitions available after Hoover clue
assert.ok(hooverAllowed.find((t) => t.id === "code-revealed"), "code-revealed available after Hoover clue");
assert.ok(hooverAllowed.find((t) => t.id === "fixel-sleeping-rejected"), "Fixel rejection available after Hoover clue");
const codeAllowed = getAllowedQuestTransitions(codeRevealed, "uk");
assert.equal(codeAllowed.find((t) => t.id === "code-revealed"), undefined);

// door-opened available after code reveal
assert.ok(codeAllowed.find((t) => t.id === "door-opened"), "door-opened available after code reveal");
const doorAllowed = getAllowedQuestTransitions(doorOpen, "uk");
assert.equal(doorAllowed.find((t) => t.id === "door-opened"), undefined);

// isTransitionLegal: Dan door check
const danDoor = analyzeQuestTranscript("Dan, check the door");
assert.equal(isTransitionLegal("dan-badge-asked", initial, danDoor), true);
assert.equal(isTransitionLegal("dan-badge-asked", danChecked, danDoor), false);

// isTransitionLegal: Hoover gentle clue
const hooverGentle = analyzeQuestTranscript("Hoover, sweet cat, please help");
assert.equal(isTransitionLegal("hoover-clue-given", danChecked, hooverGentle), true);
assert.equal(isTransitionLegal("hoover-clue-given", initial, hooverGentle), false);

// isTransitionLegal: Hoover ordinary rejection
const hooverRough = analyzeQuestTranscript("Hoover, give me the code");
assert.equal(isTransitionLegal("hoover-ordinary-rejected", danChecked, hooverRough), true);
assert.equal(isTransitionLegal("hoover-clue-given", danChecked, hooverRough), false);

// isTransitionLegal: Fixel wake reveals code
const fixelWake = analyzeQuestTranscript("Гей, Фіксель, прокидайся");
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelWake), true);
assert.equal(isTransitionLegal("code-revealed", danChecked, fixelWake), false);

// isTransitionLegal: Fixel plain request does not reveal code
const fixelPlain = analyzeQuestTranscript("Фіксель, дай код");
assert.equal(isTransitionLegal("fixel-sleeping-rejected", hooverClue, fixelPlain), true);
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelPlain), false);

// isTransitionLegal: door-opened requires Dan + revealed 404
const danCode = analyzeQuestTranscript("Dan, code 404");
assert.equal(isTransitionLegal("door-opened", codeRevealed, danCode), true);
assert.equal(isTransitionLegal("door-opened", hooverClue, danCode), false);

// sofia-hint-given requires direct Sofia address + hint intent
const sofiaHint = analyzeQuestTranscript("Софіє, дай підказку");
assert.equal(isTransitionLegal("sofia-hint-given", initial, sofiaHint), true);
const unaddressedHelp = analyzeQuestTranscript("дай підказку");
assert.equal(isTransitionLegal("sofia-hint-given", initial, unaddressedHelp), false);

console.log("transitions.test: passed (28 assertions)");
