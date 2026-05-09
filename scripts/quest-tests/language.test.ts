import { strict as assert } from "node:assert";
import { decideQuestLanguage } from "../../src/server/quest/index.js";

// High-confidence ElevenLabs provider input -> returns provider language
const highConfidenceEn = decideQuestLanguage({
  transcript: "hello",
  language: {
    language: "en",
    providerLanguageCode: "en-US",
    confidence: 0.9,
    source: "elevenlabs",
  },
});
assert.equal(highConfidenceEn.language, "en", "high-confidence en -> en");
assert.equal(highConfidenceEn.source, "elevenlabs");

const highConfidenceUk = decideQuestLanguage({
  transcript: "привіт",
  language: {
    language: "uk",
    providerLanguageCode: "uk-UA",
    confidence: 0.85,
    source: "elevenlabs",
  },
});
assert.equal(highConfidenceUk.language, "uk", "high-confidence uk -> uk");

// Ambiguous transcript ("мяу") with sticky previousLanguage -> returns sticky
const stickyEn = decideQuestLanguage({
  transcript: "мяу",
  previousLanguage: "en",
});
assert.equal(stickyEn.language, "en", "ambiguous with sticky -> sticky language");
assert.equal(stickyEn.source, "sticky");
assert.equal(stickyEn.ambiguous, true);

// Ambiguous transcript without previousLanguage -> default uk
const defaultFromAmbiguous = decideQuestLanguage({
  transcript: "мяу",
});
assert.equal(defaultFromAmbiguous.language, "uk", "ambiguous no sticky -> uk default");
assert.equal(defaultFromAmbiguous.source, "default");

// Heuristic UK transcript -> uk
const heuristicUk = decideQuestLanguage({
  transcript: "як тебе звати охоронець",
});
assert.equal(heuristicUk.language, "uk", "heuristic uk transcript -> uk");
assert.equal(heuristicUk.source, "heuristic");

// Heuristic EN transcript -> en
const heuristicEn = decideQuestLanguage({
  transcript: "what is your name guard",
});
assert.equal(heuristicEn.language, "en", "heuristic en transcript -> en");
assert.equal(heuristicEn.source, "heuristic");

// Empty transcript -> default uk
const emptyDefault = decideQuestLanguage({
  transcript: "",
});
assert.equal(emptyDefault.language, "uk", "empty transcript -> uk default");
assert.equal(emptyDefault.source, "default");

// Low-confidence provider does not override heuristic
const lowConfidenceProvider = decideQuestLanguage({
  transcript: "як тебе звати",
  language: {
    language: "en",
    providerLanguageCode: "en-US",
    confidence: 0.3,
    source: "elevenlabs",
  },
});
assert.equal(lowConfidenceProvider.language, "uk", "low-confidence provider loses to heuristic");

console.log("language.test: passed (12 assertions)");
