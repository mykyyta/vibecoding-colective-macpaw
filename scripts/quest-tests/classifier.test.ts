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
assert.equal(hooverPlain.hasHooverAddress, true, "Hoover -> hasHooverAddress");
assert.equal(hooverPlain.hasGentleHooverAddress, false, "plain command is not gentle");

// Bare politeness is not affectionate enough for Hoover
const hooverPlease = analyzeQuestTranscript("Хувере, будь ласка, допоможи");
assert.equal(hooverPlease.hasHoover, true, "Хувере -> hasHoover");
assert.equal(hooverPlease.hasHooverAddress, true, "Хувере -> hasHooverAddress");
assert.equal(hooverPlease.hasGentleHooverAddress, false, "будь ласка alone is not affectionate");

// Hoover-like affectionate address tolerates imperfect name transcription
const hooverAffectionate = analyzeQuestTranscript("Хуверчику, допоможи");
assert.equal(hooverAffectionate.hasHoover, true, "Хуверчику -> hasHoover");
assert.equal(hooverAffectionate.hasGentleHooverAddress, true, "Хуверчику -> affectionate Hoover");

// Affectionate cat address can target Hoover even without the proper name
const catAffectionate = analyzeQuestTranscript("Котику муркотунчику, допоможи");
assert.equal(catAffectionate.hasHoover, false, "no proper Hoover name");
assert.equal(catAffectionate.hasHooverAddress, true, "cat affection -> hasHooverAddress");
assert.equal(catAffectionate.hasGentleHooverAddress, true, "cat affection -> affectionate Hoover");

const englishKitty = analyzeQuestTranscript("Good kitty, did you see the badge?");
assert.equal(englishKitty.hasHooverAddress, true, "good kitty -> hasHooverAddress");
assert.equal(englishKitty.hasGentleHooverAddress, true, "good kitty -> affectionate Hoover");

// Fixel direct without wake attempt
const fixelPlain = analyzeQuestTranscript("Фіксель, дай код");
assert.equal(fixelPlain.hasFixel, true, "Фіксель -> hasFixel");
assert.equal(fixelPlain.hasFoodOffer, false, "дай код is not a food mention");

// Fixel direct with food mention
const fixelFood = analyzeQuestTranscript("Фіксель, хочеш ласощів");
assert.equal(fixelFood.hasFixel, true, "Фіксель -> hasFixel");
assert.equal(fixelFood.hasFoodOffer, true, "ласощів -> food mention");

const fixelCandy = analyzeQuestTranscript("Фіксель, як тобі ця цукерочка?");
assert.equal(fixelCandy.hasFixel, true, "Фіксель -> hasFixel");
assert.equal(fixelCandy.hasFoodOffer, true, "цукерочка -> food mention");

const fixelWhiskas = analyzeQuestTranscript("Фіксель, корм віскас");
assert.equal(fixelWhiskas.hasFixel, true, "Фіксель -> hasFixel");
assert.equal(fixelWhiskas.hasFoodOffer, true, "корм віскас -> food mention");

// Plain wake words alone are not food mentions
const fixelWake = analyzeQuestTranscript("Гей, Фіксель, прокидайся");
assert.equal(fixelWake.hasFixel, true, "Фіксель -> hasFixel");
assert.equal(fixelWake.hasFoodOffer, false, "прокидайся alone is no longer the trigger");

// Sofia direct address and hint intent
const sofiaHint = analyzeQuestTranscript("Софіє, дай підказку");
assert.equal(sofiaHint.hasSofia, true, "Софіє -> hasSofia");
assert.equal(sofiaHint.hasSofiaAddress, true, "Софіє -> hasSofiaAddress");
assert.equal(sofiaHint.hasHintIntent, true, "підказку -> hasHintIntent");

// Unaddressed uncertainty also counts as help intent
const unaddressedStuck = analyzeQuestTranscript("я не знаю що робити");
assert.equal(unaddressedStuck.hasSofiaAddress, false, "no Sofia address");
assert.equal(unaddressedStuck.hasHintIntent, true, "uncertainty -> hasHintIntent");

const whatShouldIDo = analyzeQuestTranscript("що мені робити?");
assert.equal(whatShouldIDo.hasSofiaAddress, false, "no Sofia address");
assert.equal(whatShouldIDo.hasHintIntent, true, "що мені робити -> hasHintIntent");

const russianWhatToDo = analyzeQuestTranscript("что мне делать?");
assert.equal(russianWhatToDo.hasHintIntent, true, "что мне делать -> hasHintIntent");

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

console.log("classifier.test: passed (42 assertions)");
