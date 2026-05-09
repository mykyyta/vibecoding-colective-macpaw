import { strict as assert } from "node:assert";
import { analyzeQuestTranscript } from "../../src/server/quest/index.js";

// Pixel + purr via "мяу"
const pixelMyau = analyzeQuestTranscript("Pixel мяу");
assert.equal(pixelMyau.hasPixel, true, "Pixel мяу -> hasPixel");
assert.equal(pixelMyau.hasPurr, true, "Pixel мяу -> hasPurr");

// Pixel + purr via "промуркай"
const pixelPromurkay = analyzeQuestTranscript("Pixel, промуркай");
assert.equal(pixelPromurkay.hasPixel, true, "промуркай -> hasPixel");
assert.equal(pixelPromurkay.hasPurr, true, "промуркай -> hasPurr");

// Pixel alias (Піксель) + purr via "мур-мур"
const piksellMur = analyzeQuestTranscript("Піксель, мур-мур");
assert.equal(piksellMur.hasPixel, true, "Піксель -> hasPixel");
assert.equal(piksellMur.hasPurr, true, "мур-мур -> hasPurr");

// Sofia direct address
const sofiaDirect = analyzeQuestTranscript("Софія, чи є ідеї");
assert.equal(sofiaDirect.hasSofia, true, "Софія -> hasSofia");
assert.equal(sofiaDirect.hasSofiaAddress, true, "Софія -> hasSofiaAddress");

// Feminine generic address -> hasFeminineAddress, hasSofiaAddress
const feminineAddr = analyzeQuestTranscript("дівчино, привіт");
assert.equal(feminineAddr.hasFeminineAddress, true, "дівчино -> hasFeminineAddress");
assert.equal(feminineAddr.hasSofiaAddress, true, "дівчино -> hasSofiaAddress");
assert.equal(feminineAddr.hasSofia, false, "дівчино alone -> hasSofia false");

// Cat indirect address via "котику"
const catWord = analyzeQuestTranscript("котику, як справи");
assert.equal(catWord.hasCatAddress, true, "котику -> hasCatAddress");
assert.equal(catWord.hasPixel, false, "котику alone -> hasPixel false (indirect only)");

// Oleg + door
const olegDoor = analyzeQuestTranscript("Олег, відкрий двері");
assert.equal(olegDoor.hasOleg, true, "Олег -> hasOleg");
assert.equal(olegDoor.hasDoor, true, "відкрий двері -> hasDoor");

// Code 404 + code intent
const code404 = analyzeQuestTranscript("код 404");
assert.equal(code404.hasCode404, true, "404 -> hasCode404");
assert.equal(code404.hasCodeIntent, true, "код -> hasCodeIntent");

// VCC intent
const vcc = analyzeQuestTranscript("VCC?");
assert.equal(vcc.hasVccIntent, true, "VCC -> hasVccIntent");

// No false positives: purr without pixel does not set hasPixel
const purrOnly = analyzeQuestTranscript("мяу");
assert.equal(purrOnly.hasPurr, true, "мяу -> hasPurr");
assert.equal(purrOnly.hasPixel, false, "мяу alone -> hasPixel false");

// Oleg alias "oleh"
const olegEn = analyzeQuestTranscript("Oleg, open the door");
assert.equal(olegEn.hasOleg, true, "Oleg -> hasOleg");
assert.equal(olegEn.hasDoor, true, "door -> hasDoor");

// Sofia English alias "Sofiia"
const sofiiaEn = analyzeQuestTranscript("Sofiia, any ideas?");
assert.equal(sofiiaEn.hasSofia, true, "Sofiia -> hasSofia");
assert.equal(sofiiaEn.hasSofiaAddress, true);

console.log("classifier.test: passed (17 assertions)");
