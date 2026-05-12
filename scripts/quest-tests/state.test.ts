import { strict as assert } from "node:assert";
import { normalizeQuestState } from "../../src/server/quest/index.js";

// danExplainedDoor requires sofiaIntroduced
const danExplainedNoIntro = normalizeQuestState({ danExplainedDoor: true });
assert.equal(danExplainedNoIntro.danExplainedDoor, false, "danExplainedDoor stripped without intro");
assert.equal(danExplainedNoIntro.sofiaIntroduced, false);

// danExplainedDoor propagates when sofiaIntroduced is true
const danExplained = normalizeQuestState({ sofiaIntroduced: true, danExplainedDoor: true });
assert.equal(danExplained.sofiaIntroduced, true);
assert.equal(danExplained.danExplainedDoor, true);

// danBadgeAsked requires danExplainedDoor (and transitively sofiaIntroduced)
const danBadgeNoExplained = normalizeQuestState({
  sofiaIntroduced: true,
  danBadgeAsked: true,
});
assert.equal(danBadgeNoExplained.danBadgeAsked, false, "danBadgeAsked stripped without phase 1");

// danBadgeAsked propagates when phase 1 is done
const danBadge = normalizeQuestState({
  sofiaIntroduced: true,
  danExplainedDoor: true,
  danBadgeAsked: true,
});
assert.equal(danBadge.danBadgeAsked, true);

// hooverClueGiven requires danBadgeAsked
const hooverNoDanBadge = normalizeQuestState({
  sofiaIntroduced: true,
  danExplainedDoor: true,
  hooverClueGiven: true,
});
assert.equal(hooverNoDanBadge.hooverClueGiven, false, "hooverClueGiven stripped without phase 2");

// hooverClueGiven propagates when the full chain is satisfied
const hoover = normalizeQuestState({
  sofiaIntroduced: true,
  danExplainedDoor: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
});
assert.equal(hoover.hooverClueGiven, true);

// codeRevealed requires hooverClueGiven
const codeNoHoover = normalizeQuestState({
  sofiaIntroduced: true,
  danExplainedDoor: true,
  danBadgeAsked: true,
  codeRevealed: true,
});
assert.equal(codeNoHoover.codeRevealed, false, "codeRevealed stripped without Hoover clue");

const code = normalizeQuestState({
  sofiaIntroduced: true,
  danExplainedDoor: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
  codeRevealed: true,
});
assert.equal(code.codeRevealed, true);

// doorOpen requires codeRevealed
const doorNoCode = normalizeQuestState({
  sofiaIntroduced: true,
  danExplainedDoor: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
  doorOpen: true,
});
assert.equal(doorNoCode.doorOpen, false, "doorOpen stripped without codeRevealed");

const door = normalizeQuestState({
  sofiaIntroduced: true,
  danExplainedDoor: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
  codeRevealed: true,
  doorOpen: true,
});
assert.equal(door.doorOpen, true);

// every flag collapses when sofiaIntroduced is false (chain root)
const noIntro = normalizeQuestState({
  danExplainedDoor: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
  codeRevealed: true,
  doorOpen: true,
});
assert.equal(noIntro.sofiaIntroduced, false);
assert.equal(noIntro.danExplainedDoor, false, "danExplainedDoor stripped without intro");
assert.equal(noIntro.danBadgeAsked, false, "danBadgeAsked stripped without intro");
assert.equal(noIntro.hooverClueGiven, false);
assert.equal(noIntro.codeRevealed, false);
assert.equal(noIntro.doorOpen, false);

// empty + null inputs produce all-false state
const empty = normalizeQuestState({});
assert.equal(empty.sofiaIntroduced, false);
assert.equal(empty.danExplainedDoor, false);
assert.equal(empty.danBadgeAsked, false);
assert.equal(empty.hooverClueGiven, false);
assert.equal(empty.codeRevealed, false);
assert.equal(empty.doorOpen, false);

const fromNull = normalizeQuestState(null);
assert.equal(fromNull.sofiaIntroduced, false);

console.log("state.test: passed (19 assertions)");
