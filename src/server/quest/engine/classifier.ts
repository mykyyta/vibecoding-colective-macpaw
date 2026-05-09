import { PERSONAS } from "../scenario/actors.js";
import {
  DOOR_ALIASES,
  NAME_QUESTION_ALIASES,
  CODE_ALIASES,
  CODE_INTENT_ALIASES,
  VCC_ALIASES,
  SMALLTALK_ALIASES,
} from "../scenario/aliases.js";

export interface QuestTranscriptFacts {
  text: string;
  matched: string[];
  hasOleg: boolean;
  hasPixel: boolean;
  hasCatAddress: boolean;
  hasSofia: boolean;
  hasFeminineAddress: boolean;
  hasSofiaAddress: boolean;
  hasDoor: boolean;
  hasNameQuestion: boolean;
  hasCode404: boolean;
  hasCodeIntent: boolean;
  hasVccIntent: boolean;
  hasPurr: boolean;
  hasSmalltalk: boolean;
}

export function analyzeQuestTranscript(transcript: string): QuestTranscriptFacts {
  const text = normalizeTranscript(transcript);
  const matched: string[] = [];
  const hasOleg = includesAny(text, PERSONAS.guard.transcriptAliases.direct ?? [], matched);
  const hasPixel = includesAny(text, PERSONAS.pixel.transcriptAliases.direct ?? [], matched);
  const hasCatAddress = includesAny(text, PERSONAS.pixel.transcriptAliases.indirect ?? [], matched);
  const hasSofia = includesAny(text, PERSONAS.sofia.transcriptAliases.direct ?? [], matched);
  const hasFeminineAddress = includesAny(text, PERSONAS.sofia.transcriptAliases.feminine ?? [], matched);
  const hasSofiaAddress = hasSofia || hasFeminineAddress;
  const hasDoor = includesAny(text, DOOR_ALIASES, matched);
  const hasNameQuestion = includesAny(text, NAME_QUESTION_ALIASES, matched);
  const hasCode404 = includesAny(text, CODE_ALIASES, matched);
  const hasCodeIntent = includesAny(text, CODE_INTENT_ALIASES, matched);
  const hasVccIntent = includesAny(text, VCC_ALIASES, matched);
  const purrMatches = findPurrMatches(text);
  const hasPurr = purrMatches.length > 0;
  matched.push(...purrMatches);
  const hasSmalltalk = includesAny(text, SMALLTALK_ALIASES, matched);

  return {
    text,
    matched,
    hasOleg,
    hasPixel,
    hasCatAddress,
    hasSofia,
    hasFeminineAddress,
    hasSofiaAddress,
    hasDoor,
    hasNameQuestion,
    hasCode404,
    hasCodeIntent,
    hasVccIntent,
    hasPurr,
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
    /(?<=^|[^\p{L}\p{N}_])(мур[\p{L}]*|муркот[\p{L}]*|промур[\p{L}]*|помур[\p{L}]*|мрр+|мр+|мяу[\p{L}]*|мяв[\p{L}]*|м[\s-]?я[\s-]?у+|нявк[\p{L}]*|нявч[\p{L}]*|няв+|няу+|н[\s-]?я[\s-]?у+|пур[\p{L}]*|пурр+|пурч[\p{L}]*|пурн[\p{L}]*|пр+|purr[\p{L}]*|pur+|mur[\p{L}]*|meow[\p{L}]*|mew+|mrow+|nya[\p{L}]*|nyan+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+|mrr+)(?=$|[^\p{L}\p{N}_])/gu,
  );

  return [...matches].map((match) => match[1]).filter(Boolean);
}
