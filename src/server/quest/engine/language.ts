import type {
  QuestLanguage,
  QuestLanguageDecision,
  QuestLanguageInput,
} from "../../../shared/voice.js";
import { findPurrMatches, normalizeTranscript } from "./classifier.js";

export interface QuestLanguageDecisionRequest {
  transcript: string;
  language?: QuestLanguageInput;
  previousLanguage?: QuestLanguage;
}

const DEFAULT_REPLY_LANGUAGE: QuestLanguage = "uk";
const HIGH_CONFIDENCE_LANGUAGE_THRESHOLD = 0.75;
const HEURISTIC_LANGUAGE_THRESHOLD = 0.62;

export function decideQuestLanguage({
  transcript,
  language,
  previousLanguage,
}: QuestLanguageDecisionRequest): QuestLanguageDecision {
  const providerLanguage =
    language?.language ?? parseSupportedLanguageCode(language?.providerLanguageCode);
  const confidence = clampLanguageConfidence(language?.confidence);
  const source =
    language?.source ?? (language?.providerLanguageCode ? "elevenlabs" : undefined);
  const ambiguous = isLanguageAmbiguousTranscript(transcript);

  if (
    providerLanguage &&
    confidence !== undefined &&
    confidence >= HIGH_CONFIDENCE_LANGUAGE_THRESHOLD
  ) {
    return {
      language: providerLanguage,
      source: source ?? "elevenlabs",
      confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous,
    };
  }

  if (ambiguous && previousLanguage) {
    return {
      language: previousLanguage,
      source: "sticky",
      confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous: true,
    };
  }

  if (ambiguous) {
    return {
      language: DEFAULT_REPLY_LANGUAGE,
      source: "default",
      confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous: true,
    };
  }

  const heuristic = inferQuestLanguageFromTranscript(transcript);

  if (heuristic && heuristic.confidence >= HEURISTIC_LANGUAGE_THRESHOLD) {
    return {
      language: heuristic.language,
      source: "heuristic",
      confidence: heuristic.confidence,
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous,
    };
  }

  if (providerLanguage && !ambiguous && confidence === undefined) {
    return {
      language: providerLanguage,
      source: source ?? "browser-speech",
      providerLanguageCode: language?.providerLanguageCode,
      ambiguous,
    };
  }

  return {
    language: DEFAULT_REPLY_LANGUAGE,
    source: "default",
    confidence,
    providerLanguageCode: language?.providerLanguageCode,
    ambiguous,
  };
}

function parseSupportedLanguageCode(
  languageCode: string | undefined,
): QuestLanguage | undefined {
  const normalized = languageCode?.toLocaleLowerCase("en-US").trim();

  if (!normalized) {
    return undefined;
  }

  if (normalized === "uk" || normalized.startsWith("uk-")) {
    return "uk";
  }

  if (normalized === "en" || normalized.startsWith("en-")) {
    return "en";
  }

  return undefined;
}

function clampLanguageConfidence(
  confidence: number | undefined,
): number | undefined {
  if (confidence === undefined || Number.isNaN(confidence)) {
    return undefined;
  }

  return Math.max(0, Math.min(1, confidence));
}

function isLanguageAmbiguousTranscript(transcript: string): boolean {
  const text = normalizeTranscript(transcript);

  if (!text) {
    return true;
  }

  const words = text.split(" ");
  const compact = text.replace(/\s+/g, "");
  const ambiguousTokens = new Set([
    "404",
    "pixel",
    "pix",
    "oleg",
    "oleh",
    "мур",
    "мр",
    "мрр",
    "няв",
    "мяу",
    "purr",
    "prr",
    "mrr",
    "meow",
    "mew",
  ]);

  if (words.length <= 2 && words.every((word) => ambiguousTokens.has(word))) {
    return true;
  }

  return (
    words.length <= 3 &&
    (compact === "404" || findPurrMatches(text).length > 0) &&
    !/[іїєґа-я]/u.test(text.replace(/мур|мр+|мяу|няв/gu, ""))
  );
}

function inferQuestLanguageFromTranscript(
  transcript: string,
): { language: QuestLanguage; confidence: number } | undefined {
  const text = normalizeTranscript(transcript);

  if (!text) {
    return undefined;
  }

  let ukScore = 0;
  let enScore = 0;

  if (/[іїєґ]/u.test(text)) {
    ukScore += 4;
  }

  if (/[а-я]/u.test(text)) {
    ukScore += 2;
  }

  if (/\b(як|тебе|вас|звати|хто|відкрий|відчин|двер|вихід|код|дякую|привіт)\b/u.test(text)) {
    ukScore += 3;
  }

  if (/[a-z]/u.test(text)) {
    enScore += 1;
  }

  if (
    /\b(what|who|your|name|open|door|exit|unlock|code|hello|thanks|please|let|out|guard)\b/u.test(
      text,
    )
  ) {
    enScore += 3;
  }

  if (ukScore === 0 && enScore === 0) {
    return undefined;
  }

  if (ukScore === enScore) {
    return undefined;
  }

  const total = ukScore + enScore;
  const language = ukScore > enScore ? "uk" : "en";
  const confidence = Math.max(ukScore, enScore) / total;

  return { language, confidence };
}
