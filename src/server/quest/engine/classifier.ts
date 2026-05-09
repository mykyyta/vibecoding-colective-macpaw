import { PERSONAS } from "../scenario/actors.js";
import {
  DOOR_ALIASES,
  CODE_ALIASES,
  CODE_INTENT_ALIASES,
  GENTLE_ALIASES,
  HINT_INTENT_ALIASES,
  VCC_ALIASES,
  SMALLTALK_ALIASES,
  WAKE_ALIASES,
} from "../scenario/aliases.js";

export interface QuestTranscriptFacts {
  text: string;
  matched: string[];
  hasDan: boolean;
  hasHoover: boolean;
  hasFixel: boolean;
  hasCatAddress: boolean;
  hasSofia: boolean;
  hasFeminineAddress: boolean;
  hasSofiaAddress: boolean;
  hasDoor: boolean;
  hasCode404: boolean;
  hasCodeIntent: boolean;
  hasHintIntent: boolean;
  hasVccIntent: boolean;
  hasGentleHooverAddress: boolean;
  hasWakeAttempt: boolean;
  hasSmalltalk: boolean;
}

export function analyzeQuestTranscript(transcript: string): QuestTranscriptFacts {
  const text = normalizeTranscript(transcript);
  const matched: string[] = [];
  const hasDan = includesAny(text, PERSONAS.dan.transcriptAliases.direct ?? [], matched);
  const hasHoover = includesAny(text, PERSONAS.hoover.transcriptAliases.direct ?? [], matched);
  const hasFixel = includesAny(text, PERSONAS.fixel.transcriptAliases.direct ?? [], matched);
  const hasCatAddress = includesAny(
    text,
    [
      ...(PERSONAS.hoover.transcriptAliases.indirect ?? []),
      ...(PERSONAS.fixel.transcriptAliases.indirect ?? []),
    ],
    matched,
  );
  const hasSofia = includesAny(text, PERSONAS.sofia.transcriptAliases.direct ?? [], matched);
  const hasFeminineAddress = includesAny(text, PERSONAS.sofia.transcriptAliases.feminine ?? [], matched);
  const hasSofiaAddress = hasSofia || hasFeminineAddress;
  const hasDoor = includesAny(text, DOOR_ALIASES, matched);
  const hasCode404 = includesAny(text, CODE_ALIASES, matched);
  const hasCodeIntent = includesAny(text, CODE_INTENT_ALIASES, matched);
  const hasHintIntent = includesAny(text, HINT_INTENT_ALIASES, matched);
  const hasVccIntent = includesAny(text, VCC_ALIASES, matched);
  const hasGentleHooverAddress =
    hasHoover && includesAny(text, GENTLE_ALIASES, matched);
  const hasWakeAttempt = includesAny(text, WAKE_ALIASES, matched);
  const hasSmalltalk = includesAny(text, SMALLTALK_ALIASES, matched);

  return {
    text,
    matched,
    hasDan,
    hasHoover,
    hasFixel,
    hasCatAddress,
    hasSofia,
    hasFeminineAddress,
    hasSofiaAddress,
    hasDoor,
    hasCode404,
    hasCodeIntent,
    hasHintIntent,
    hasVccIntent,
    hasGentleHooverAddress,
    hasWakeAttempt,
    hasSmalltalk,
  };
}

export function normalizeTranscript(transcript: string): string {
  return transcript
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKC")
    .replace(/[ʼ'`]/g, "")
    .replace(/[.,!?;:()[\]{}"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(
  text: string,
  needles: string[],
  matched: string[],
): boolean {
  let found = false;

  for (const needle of needles) {
    if (text.includes(needle)) {
      matched.push(needle);
      found = true;
    }
  }

  return found;
}

export function findPurrMatches(text: string): string[] {
  const matches = text.matchAll(
    /(?<=^|[^\p{L}\p{N}_])(мур[\p{L}]*|муркот[\p{L}]*|мрр+|мр+|мяу[\p{L}]*|мяв[\p{L}]*|м[\s-]?я[\s-]?у+|нявк[\p{L}]*|нявч[\p{L}]*|няв+|няу+|н[\s-]?я[\s-]?у+|пур[\p{L}]*|пурр+|purr[\p{L}]*|pur+|mur[\p{L}]*|meow[\p{L}]*|mew+|mrow+|nya[\p{L}]*|nyan+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+|mrr+)(?=$|[^\p{L}\p{N}_])/gu,
  );

  return [...matches].map((match) => match[1]).filter(Boolean);
}
