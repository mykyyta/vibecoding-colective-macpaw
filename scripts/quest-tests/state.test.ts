import { strict as assert } from "node:assert";
import { normalizeQuestState } from "../../src/server/quest/index.js";

// guardHintGiven requires olegNameKnown
const withGuardHintNoOleg = normalizeQuestState({ guardHintGiven: true, olegNameKnown: false });
assert.equal(withGuardHintNoOleg.guardHintGiven, false, "guardHintGiven stripped when olegNameKnown is false");
assert.equal(withGuardHintNoOleg.olegNameKnown, false);

// guardHintGiven propagates when olegNameKnown is true
const withGuardHint = normalizeQuestState({ guardHintGiven: true, olegNameKnown: true });
assert.equal(withGuardHint.guardHintGiven, true);
assert.equal(withGuardHint.olegNameKnown, true);

// codeRevealed requires guardHintGiven
const withCodeNoGuardHint = normalizeQuestState({ codeRevealed: true, olegNameKnown: true });
assert.equal(withCodeNoGuardHint.codeRevealed, false, "codeRevealed stripped when guardHintGiven is false");

// codeRevealed propagates when chain is satisfied
const withCode = normalizeQuestState({ olegNameKnown: true, guardHintGiven: true, codeRevealed: true });
assert.equal(withCode.codeRevealed, true);

// doorOpen requires olegNameKnown and codeRevealed (and thus guardHintGiven)
const withDoorNoCode = normalizeQuestState({ olegNameKnown: true, guardHintGiven: true, doorOpen: true });
assert.equal(withDoorNoCode.doorOpen, false, "doorOpen stripped when codeRevealed is false");

const withDoorNoOleg = normalizeQuestState({ guardHintGiven: true, codeRevealed: true, doorOpen: true });
assert.equal(withDoorNoOleg.doorOpen, false, "doorOpen stripped when olegNameKnown is false");

// doorOpen propagates when full chain is satisfied
const withDoor = normalizeQuestState({ olegNameKnown: true, guardHintGiven: true, codeRevealed: true, doorOpen: true });
assert.equal(withDoor.doorOpen, true);

// pixelRejectedOrdinaryCommand requires guardHintGiven
const withPixelNoGuard = normalizeQuestState({ olegNameKnown: true, pixelRejectedOrdinaryCommand: true });
assert.equal(withPixelNoGuard.pixelRejectedOrdinaryCommand, false, "pixelRejectedOrdinaryCommand stripped when guardHintGiven is false");

const withPixel = normalizeQuestState({ olegNameKnown: true, guardHintGiven: true, pixelRejectedOrdinaryCommand: true });
assert.equal(withPixel.pixelRejectedOrdinaryCommand, true);

// null/undefined/empty input produces all-false state
const empty = normalizeQuestState({});
assert.equal(empty.olegNameKnown, false);
assert.equal(empty.guardHintGiven, false);
assert.equal(empty.pixelRejectedOrdinaryCommand, false);
assert.equal(empty.codeRevealed, false);
assert.equal(empty.doorOpen, false);

const fromNull = normalizeQuestState(null);
assert.equal(fromNull.olegNameKnown, false);

console.log("state.test: passed (9 assertions)");
