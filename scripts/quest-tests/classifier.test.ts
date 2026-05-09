import { strict as assert } from "node:assert";
import { analyzeQuestTranscript } from "../../src/server/quest/index.js";

// Dan + door
const danDoor = analyzeQuestTranscript("Dan, can you check the door?");
assert.equal(danDoor.hasDan, true, "Dan -> hasDan");
assert.equal(danDoor.hasDoor, true, "door -> hasDoor");

// Ukrainian Dan + door
const denDoor = analyzeQuestTranscript("Дене, перевір двері");
assert.equal(denDoor.hasDan, true, "Дене -> hasDan");
assert.equal(denDoor.hasDoor, true, "двері -> hasDoor");

// Hoover direct without gentle wording
const hooverPlain = analyzeQuestTranscript("Hoover, give me the code");
assert.equal(hooverPlain.hasHoover, true, "Hoover -> hasHoover");
assert.equal(hooverPlain.hasGentleHooverAddress, false, "plain command is not gentle");

// Hoover direct with gentle wording
const hooverGentle = analyzeQuestTranscript("Хувере, будь ласка, допоможи");
assert.equal(hooverGentle.hasHoover, true, "Хувере -> hasHoover");
assert.equal(hooverGentle.hasGentleHooverAddress, true, "будь ласка -> gentle Hoover");

// Fixel direct without wake attempt
const fixelPlain = analyzeQuestTranscript("Фіксель, дай код");
assert.equal(fixelPlain.hasFixel, true, "Фіксель -> hasFixel");
assert.equal(fixelPlain.hasWakeAttempt, false, "дай код is not a wake attempt");

// Fixel direct with wake attempt
const fixelWake = analyzeQuestTranscript("Гей, Фіксель, прокидайся");
assert.equal(fixelWake.hasFixel, true, "Фіксель -> hasFixel");
assert.equal(fixelWake.hasWakeAttempt, true, "прокидайся -> wake attempt");

// Sofia direct address and hint intent
const sofiaHint = analyzeQuestTranscript("Софіє, дай підказку");
assert.equal(sofiaHint.hasSofia, true, "Софіє -> hasSofia");
assert.equal(sofiaHint.hasSofiaAddress, true, "Софіє -> hasSofiaAddress");
assert.equal(sofiaHint.hasHintIntent, true, "підказку -> hasHintIntent");

// Feminine generic address -> hasFeminineAddress, hasSofiaAddress
const feminineAddr = analyzeQuestTranscript("дівчино, є ідеї");
assert.equal(feminineAddr.hasFeminineAddress, true, "дівчино -> hasFeminineAddress");
assert.equal(feminineAddr.hasSofiaAddress, true, "дівчино -> hasSofiaAddress");
assert.equal(feminineAddr.hasHintIntent, true, "ідеї -> hasHintIntent");

// Code 404 + code intent
const code404 = analyzeQuestTranscript("Dan, code 404");
assert.equal(code404.hasDan, true, "Dan -> hasDan");
assert.equal(code404.hasCode404, true, "404 -> hasCode404");
assert.equal(code404.hasCodeIntent, true, "code -> hasCodeIntent");

// VCC intent
const vcc = analyzeQuestTranscript("VCC?");
assert.equal(vcc.hasVccIntent, true, "VCC -> hasVccIntent");

console.log("classifier.test: passed (22 assertions)");
