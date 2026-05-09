import { strict as assert } from "node:assert";
import {
  getAllowedQuestTransitions,
  isTransitionLegal,
} from "../../src/server/quest/index.js";
import type { QuestState } from "../../src/shared/voice.js";
import { analyzeQuestTranscript } from "../../src/server/quest/index.js";

const initial: QuestState = {
  olegNameKnown: false,
  guardHintGiven: false,
  pixelRejectedOrdinaryCommand: false,
  codeRevealed: false,
  doorOpen: false,
};

const olegKnown: QuestState = { ...initial, olegNameKnown: true };
const hintGiven: QuestState = { ...olegKnown, guardHintGiven: true };
const pixelRejected: QuestState = { ...hintGiven, pixelRejectedOrdinaryCommand: true };
const codeRevealed: QuestState = { ...hintGiven, codeRevealed: true };
const doorOpen: QuestState = { ...codeRevealed, doorOpen: true };

// chitchat-replied is always available
const initialAllowed = getAllowedQuestTransitions(initial, "uk");
const chitchatEntry = initialAllowed.find((t) => t.id === "chitchat-replied");
assert.ok(chitchatEntry, "chitchat-replied always available");

// sofia-hint-given is always available
const sofiaEntry = initialAllowed.find((t) => t.id === "sofia-hint-given");
assert.ok(sofiaEntry, "sofia-hint-given always available");

// oleg-name-learned available only before olegNameKnown
const nameLearnedInitial = initialAllowed.find((t) => t.id === "oleg-name-learned");
assert.ok(nameLearnedInitial, "oleg-name-learned available at initial");
const olegKnownAllowed = getAllowedQuestTransitions(olegKnown, "uk");
const nameLearnedAfter = olegKnownAllowed.find((t) => t.id === "oleg-name-learned");
assert.equal(nameLearnedAfter, undefined, "oleg-name-learned not available after olegNameKnown");

// guard-hint-given available only when olegNameKnown and not guardHintGiven
const guardHintInitial = initialAllowed.find((t) => t.id === "guard-hint-given");
assert.equal(guardHintInitial, undefined, "guard-hint-given not available at initial");
const guardHintOleg = olegKnownAllowed.find((t) => t.id === "guard-hint-given");
assert.ok(guardHintOleg, "guard-hint-given available when olegNameKnown");
const hintGivenAllowed = getAllowedQuestTransitions(hintGiven, "uk");
const guardHintAfter = hintGivenAllowed.find((t) => t.id === "guard-hint-given");
assert.equal(guardHintAfter, undefined, "guard-hint-given not available after guardHintGiven");

// pixel-ordinary-rejected available when guardHintGiven and not pixelRejectedOrdinaryCommand
const pixelOrdinaryHint = hintGivenAllowed.find((t) => t.id === "pixel-ordinary-rejected");
assert.ok(pixelOrdinaryHint, "pixel-ordinary-rejected available when guardHintGiven");
const pixelRejectedAllowed = getAllowedQuestTransitions(pixelRejected, "uk");
const pixelOrdinaryAfter = pixelRejectedAllowed.find((t) => t.id === "pixel-ordinary-rejected");
assert.equal(pixelOrdinaryAfter, undefined, "pixel-ordinary-rejected not available after rejection");

// code-revealed available when guardHintGiven and not codeRevealed
const codeRevHint = hintGivenAllowed.find((t) => t.id === "code-revealed");
assert.ok(codeRevHint, "code-revealed available when guardHintGiven");
const codeRevealedAllowed = getAllowedQuestTransitions(codeRevealed, "uk");
const codeRevAfter = codeRevealedAllowed.find((t) => t.id === "code-revealed");
assert.equal(codeRevAfter, undefined, "code-revealed not available after codeRevealed");

// door-opened available when olegNameKnown + codeRevealed and not doorOpen
const doorOpenEntry = codeRevealedAllowed.find((t) => t.id === "door-opened");
assert.ok(doorOpenEntry, "door-opened available when olegNameKnown and codeRevealed");
const doorOpenAllowed = getAllowedQuestTransitions(doorOpen, "uk");
const doorOpenAfter = doorOpenAllowed.find((t) => t.id === "door-opened");
assert.equal(doorOpenAfter, undefined, "door-opened not available after doorOpen");

// isTransitionLegal: oleg-name-learned legal when hasNameQuestion
const nameQuestion = analyzeQuestTranscript("як тебе звати");
assert.equal(isTransitionLegal("oleg-name-learned", initial, nameQuestion), true);
assert.equal(isTransitionLegal("oleg-name-learned", olegKnown, nameQuestion), false, "not legal after olegNameKnown");

// isTransitionLegal: guard-hint-given legal when hasOleg + hasDoor
const olegDoor = analyzeQuestTranscript("Олег, відкрий двері");
assert.equal(isTransitionLegal("guard-hint-given", olegKnown, olegDoor), true);
assert.equal(isTransitionLegal("guard-hint-given", initial, olegDoor), false, "not legal without olegNameKnown");

// isTransitionLegal: code-revealed legal when hasPixel + hasPurr
const pixelPurr = analyzeQuestTranscript("Pixel мяу");
assert.equal(isTransitionLegal("code-revealed", hintGiven, pixelPurr), true);
assert.equal(isTransitionLegal("code-revealed", initial, pixelPurr), false, "not legal without guardHintGiven");

// isTransitionLegal: door-opened legal when hasOleg + hasCode404
const olegCode = analyzeQuestTranscript("Олег, код 404");
assert.equal(isTransitionLegal("door-opened", codeRevealed, olegCode), true);
assert.equal(isTransitionLegal("door-opened", hintGiven, olegCode), false, "not legal without codeRevealed");

// chitchat-replied is always legal (no factsCheck)
const anything = analyzeQuestTranscript("привіт");
assert.equal(isTransitionLegal("chitchat-replied", initial, anything), true);
assert.equal(isTransitionLegal("chitchat-replied", doorOpen, anything), true);

console.log("transitions.test: passed (21 assertions)");
