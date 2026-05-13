import { strict as assert } from "node:assert";
import {
  getAllowedQuestTransitions,
  isTransitionLegal,
} from "../../src/server/quest/index.js";
import type { QuestState } from "../../src/shared/voice.js";
import { analyzeQuestTranscript } from "../../src/server/quest/index.js";

const fresh: QuestState = {
  sofiaIntroduced: false,
  danExplainedDoor: false,
  danBadgeAsked: false,
  hooverClueGiven: false,
  codeRevealed: false,
  doorOpen: false,
};

const introduced: QuestState = { ...fresh, sofiaIntroduced: true };
const danExplained: QuestState = { ...introduced, danExplainedDoor: true };
const danAsked: QuestState = { ...danExplained, danBadgeAsked: true };
const hooverClue: QuestState = { ...danAsked, hooverClueGiven: true };
const codeRevealed: QuestState = { ...hooverClue, codeRevealed: true };
const doorOpen: QuestState = { ...codeRevealed, doorOpen: true };

// First turn: only sofia-introduced is available
const freshAllowed = getAllowedQuestTransitions(fresh, "uk");
assert.equal(freshAllowed.length, 1, "only one transition available before intro");
assert.equal(freshAllowed[0].id, "sofia-introduced");
assert.equal(freshAllowed.find((t) => t.id === "dan-explained-door"), undefined, "no phase 1 before intro");
assert.equal(freshAllowed.find((t) => t.id === "dan-badge-asked"), undefined, "no phase 2 before intro");

// After intro: phase 1 is the next Dan step; phase 2 is not yet available
const introducedAllowed = getAllowedQuestTransitions(introduced, "uk");
assert.equal(introducedAllowed.find((t) => t.id === "sofia-introduced"), undefined, "sofia-introduced fires once");
assert.ok(introducedAllowed.find((t) => t.id === "dan-explained-door"), "phase 1 available after intro");
assert.equal(introducedAllowed.find((t) => t.id === "dan-badge-asked"), undefined, "phase 2 gated on phase 1");
assert.ok(introducedAllowed.find((t) => t.id === "chitchat-replied"), "chitchat available after intro");
assert.ok(introducedAllowed.find((t) => t.id === "sofia-hint-given"), "sofia-hint-given available after intro");

// After phase 1: phase 1 is gone, phase 2 is the next Dan step
const danExplainedAllowed = getAllowedQuestTransitions(danExplained, "uk");
assert.equal(danExplainedAllowed.find((t) => t.id === "dan-explained-door"), undefined, "phase 1 fires once");
assert.ok(danExplainedAllowed.find((t) => t.id === "dan-badge-asked"), "phase 2 available after phase 1");
assert.equal(danExplainedAllowed.find((t) => t.id === "hoover-clue-given"), undefined, "no Hoover before phase 2");

// After phase 2: Hoover transitions are available, phase 2 is gone
const danAskedAllowed = getAllowedQuestTransitions(danAsked, "uk");
assert.equal(danAskedAllowed.find((t) => t.id === "dan-badge-asked"), undefined, "phase 2 fires once");
assert.ok(danAskedAllowed.find((t) => t.id === "hoover-clue-given"), "Hoover clue available after phase 2");
assert.ok(danAskedAllowed.find((t) => t.id === "hoover-ordinary-rejected"), "Hoover rejection available after phase 2");

// Hoover transitions fire once
const hooverAllowed = getAllowedQuestTransitions(hooverClue, "uk");
assert.equal(hooverAllowed.find((t) => t.id === "hoover-clue-given"), undefined);
assert.ok(hooverAllowed.find((t) => t.id === "code-revealed"));
assert.ok(hooverAllowed.find((t) => t.id === "fixel-sleeping-rejected"));

// code-revealed and door-opened
const codeAllowed = getAllowedQuestTransitions(codeRevealed, "uk");
assert.equal(codeAllowed.find((t) => t.id === "code-revealed"), undefined);
assert.ok(codeAllowed.find((t) => t.id === "door-opened"));
const doorAllowed = getAllowedQuestTransitions(doorOpen, "uk");
assert.equal(doorAllowed.find((t) => t.id === "door-opened"), undefined);

// isTransitionLegal: sofia-introduced
assert.equal(isTransitionLegal("sofia-introduced", fresh, analyzeQuestTranscript("привіт")), true);
assert.equal(isTransitionLegal("sofia-introduced", introduced, analyzeQuestTranscript("привіт")), false);

// isTransitionLegal: phase 1 is state-gated; semantic routing belongs to the LLM prompt
const danDoorAsk = analyzeQuestTranscript("Дене, як вийти");
const plainGreeting = analyzeQuestTranscript("привіт");
assert.equal(isTransitionLegal("dan-explained-door", fresh, danDoorAsk), false, "phase 1 needs intro");
assert.equal(isTransitionLegal("dan-explained-door", introduced, danDoorAsk), true);
assert.equal(isTransitionLegal("dan-explained-door", introduced, plainGreeting), true, "available transitions do not require classifier aliases");
assert.equal(isTransitionLegal("dan-explained-door", danExplained, danDoorAsk), false, "phase 1 fires once");

// isTransitionLegal: phase 2 is state-gated; loss-suggestion is prompt-level routing
const danBadgeFollowup = analyzeQuestTranscript("Дене, а де ти бачив бейдж");
assert.equal(isTransitionLegal("dan-badge-asked", danExplained, danBadgeFollowup), true, "LLM may choose phase 2 when semantically justified");
const danLossSuggestion = analyzeQuestTranscript("Дене, може ти його загубив");
assert.equal(isTransitionLegal("dan-badge-asked", introduced, danLossSuggestion), false, "phase 2 needs phase 1");
assert.equal(isTransitionLegal("dan-badge-asked", danExplained, danLossSuggestion), true, "loss-suggestion triggers phase 2");

// isTransitionLegal: Hoover choices are state-gated; gentleness is prompt-level routing
const hooverGentle = analyzeQuestTranscript("Хуверчику, допоможи");
assert.equal(isTransitionLegal("hoover-clue-given", danAsked, hooverGentle), true);
assert.equal(isTransitionLegal("hoover-clue-given", danExplained, hooverGentle), false, "Hoover gated on phase 2");
const hooverCatAffection = analyzeQuestTranscript("Котику муркотунчику, допоможи");
assert.equal(isTransitionLegal("hoover-clue-given", danAsked, hooverCatAffection), true, "affectionate cat address can trigger Hoover");

// isTransitionLegal: Hoover ordinary rejection is also available at the Hoover stage
const hooverRough = analyzeQuestTranscript("Хувере, дай код");
assert.equal(isTransitionLegal("hoover-ordinary-rejected", danAsked, hooverRough), true);
assert.equal(isTransitionLegal("hoover-clue-given", danAsked, hooverRough), true, "prompt, not hard validation, distinguishes rough vs affectionate Hoover turns");
const hooverBarePlease = analyzeQuestTranscript("Хувере, будь ласка, допоможи");
assert.equal(isTransitionLegal("hoover-ordinary-rejected", danAsked, hooverBarePlease), true, "bare politeness is ordinary");
assert.equal(isTransitionLegal("hoover-clue-given", danAsked, hooverBarePlease), true, "bare politeness is prompt-level routing");

// Fixel code reveal is state-gated; food semantics are prompt-level routing
const fixelFood = analyzeQuestTranscript("Фіксель, хочеш ласощів?");
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelFood), true);
assert.equal(isTransitionLegal("code-revealed", danAsked, fixelFood), false);
const fixelCandy = analyzeQuestTranscript("Фіксель, як тобі ця цукерочка?");
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelCandy), true, "Fixel food comments reveal code");
const fixelWhiskas = analyzeQuestTranscript("Фіксель, корм віскас");
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelWhiskas), true, "Fixel cat-food comments reveal code");

// Fixel rejected/code-reveal choice is made by the LLM once the Fixel stage is active
const fixelPlain = analyzeQuestTranscript("Фіксель, дай код");
assert.equal(isTransitionLegal("fixel-sleeping-rejected", hooverClue, fixelPlain), true);
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelPlain), true);

// Plain wake attempt is not blocked by hard validation; prompt should choose sleeping rejection
const fixelWake = analyzeQuestTranscript("Гей, Фіксель, прокидайся");
assert.equal(isTransitionLegal("code-revealed", hooverClue, fixelWake), true, "wake-only routing is prompt-level");
assert.equal(isTransitionLegal("fixel-sleeping-rejected", hooverClue, fixelWake), true);

// door-opened is critical: the code must have been revealed and the transcript must include 404
const danCode = analyzeQuestTranscript("Дене, код 404");
assert.equal(isTransitionLegal("door-opened", codeRevealed, danCode), true);
assert.equal(isTransitionLegal("door-opened", hooverClue, danCode), false);
assert.equal(isTransitionLegal("door-opened", codeRevealed, plainGreeting), false, "door-opened still requires code 404");

// sofia-hint-given requires intro; the LLM may choose it semantically after intro
const sofiaHint = analyzeQuestTranscript("Софіє, дай підказку");
assert.equal(isTransitionLegal("sofia-hint-given", fresh, sofiaHint), false);
assert.equal(isTransitionLegal("sofia-hint-given", introduced, sofiaHint), true);
const unaddressedHelp = analyzeQuestTranscript("дай підказку");
assert.equal(isTransitionLegal("sofia-hint-given", introduced, unaddressedHelp), true);
const unaddressedStuck = analyzeQuestTranscript("я не знаю що робити");
assert.equal(isTransitionLegal("sofia-hint-given", introduced, unaddressedStuck), true);
const plainSmalltalk = analyzeQuestTranscript("класний івент");
assert.equal(isTransitionLegal("sofia-hint-given", introduced, plainSmalltalk), true);

console.log("transitions.test: passed (53 assertions)");
