import { strict as assert } from "node:assert";
import { normalizeQuestState } from "../../src/server/quest/index.js";

// hooverClueGiven requires danBadgeAsked
const withHooverNoDan = normalizeQuestState({ hooverClueGiven: true });
assert.equal(withHooverNoDan.hooverClueGiven, false, "hooverClueGiven stripped when danBadgeAsked is false");
assert.equal(withHooverNoDan.danBadgeAsked, false);

// hooverClueGiven propagates when danBadgeAsked is true
const withHoover = normalizeQuestState({ danBadgeAsked: true, hooverClueGiven: true });
assert.equal(withHoover.danBadgeAsked, true);
assert.equal(withHoover.hooverClueGiven, true);

// codeRevealed requires hooverClueGiven
const withCodeNoHoover = normalizeQuestState({ danBadgeAsked: true, codeRevealed: true });
assert.equal(withCodeNoHoover.codeRevealed, false, "codeRevealed stripped when hooverClueGiven is false");

// codeRevealed propagates when chain is satisfied
const withCode = normalizeQuestState({ danBadgeAsked: true, hooverClueGiven: true, codeRevealed: true });
assert.equal(withCode.codeRevealed, true);

// doorOpen requires codeRevealed
const withDoorNoCode = normalizeQuestState({ danBadgeAsked: true, hooverClueGiven: true, doorOpen: true });
assert.equal(withDoorNoCode.doorOpen, false, "doorOpen stripped when codeRevealed is false");

// doorOpen propagates when full chain is satisfied
const withDoor = normalizeQuestState({
  danBadgeAsked: true,
  hooverClueGiven: true,
  codeRevealed: true,
  doorOpen: true,
});
assert.equal(withDoor.doorOpen, true);

// null/undefined/empty input produces all-false state
const empty = normalizeQuestState({});
assert.equal(empty.danBadgeAsked, false);
assert.equal(empty.hooverClueGiven, false);
assert.equal(empty.codeRevealed, false);
assert.equal(empty.doorOpen, false);

const fromNull = normalizeQuestState(null);
assert.equal(fromNull.danBadgeAsked, false);

console.log("state.test: passed (9 assertions)");
