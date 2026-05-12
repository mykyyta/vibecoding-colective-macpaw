import { strict as assert } from "node:assert";
import { normalizeQuestState } from "../../src/server/quest/index.js";

// danBadgeAsked requires sofiaIntroduced
const withDanNoIntro = normalizeQuestState({ danBadgeAsked: true });
assert.equal(withDanNoIntro.danBadgeAsked, false, "danBadgeAsked stripped when sofiaIntroduced is false");
assert.equal(withDanNoIntro.sofiaIntroduced, false);

// danBadgeAsked propagates when sofiaIntroduced is true
const withDan = normalizeQuestState({ sofiaIntroduced: true, danBadgeAsked: true });
assert.equal(withDan.sofiaIntroduced, true);
assert.equal(withDan.danBadgeAsked, true);

// hooverClueGiven requires danBadgeAsked (and transitively sofiaIntroduced)
const withHooverNoDan = normalizeQuestState({ sofiaIntroduced: true, hooverClueGiven: true });
assert.equal(withHooverNoDan.hooverClueGiven, false, "hooverClueGiven stripped when danBadgeAsked is false");

// hooverClueGiven propagates when the prerequisite chain is satisfied
const withHoover = normalizeQuestState({
  sofiaIntroduced: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
});
assert.equal(withHoover.hooverClueGiven, true);

// codeRevealed requires hooverClueGiven
const withCodeNoHoover = normalizeQuestState({
  sofiaIntroduced: true,
  danBadgeAsked: true,
  codeRevealed: true,
});
assert.equal(withCodeNoHoover.codeRevealed, false, "codeRevealed stripped when hooverClueGiven is false");

// codeRevealed propagates when chain is satisfied
const withCode = normalizeQuestState({
  sofiaIntroduced: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
  codeRevealed: true,
});
assert.equal(withCode.codeRevealed, true);

// doorOpen requires codeRevealed
const withDoorNoCode = normalizeQuestState({
  sofiaIntroduced: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
  doorOpen: true,
});
assert.equal(withDoorNoCode.doorOpen, false, "doorOpen stripped when codeRevealed is false");

// doorOpen propagates when full chain is satisfied
const withDoor = normalizeQuestState({
  sofiaIntroduced: true,
  danBadgeAsked: true,
  hooverClueGiven: true,
  codeRevealed: true,
  doorOpen: true,
});
assert.equal(withDoor.doorOpen, true);

// later flags collapse when sofiaIntroduced is false (chain root)
const withoutIntro = normalizeQuestState({
  danBadgeAsked: true,
  hooverClueGiven: true,
  codeRevealed: true,
  doorOpen: true,
});
assert.equal(withoutIntro.sofiaIntroduced, false);
assert.equal(withoutIntro.danBadgeAsked, false, "danBadgeAsked stripped without intro");
assert.equal(withoutIntro.hooverClueGiven, false, "hooverClueGiven stripped without intro");
assert.equal(withoutIntro.codeRevealed, false, "codeRevealed stripped without intro");
assert.equal(withoutIntro.doorOpen, false, "doorOpen stripped without intro");

// null/undefined/empty input produces all-false state
const empty = normalizeQuestState({});
assert.equal(empty.sofiaIntroduced, false);
assert.equal(empty.danBadgeAsked, false);
assert.equal(empty.hooverClueGiven, false);
assert.equal(empty.codeRevealed, false);
assert.equal(empty.doorOpen, false);

const fromNull = normalizeQuestState(null);
assert.equal(fromNull.sofiaIntroduced, false);

console.log("state.test: passed (16 assertions)");
