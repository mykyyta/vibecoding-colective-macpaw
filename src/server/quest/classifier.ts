import { PERSONAS } from "./personas.js";

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
  const hasDoor = includesAny(
    text,
    [
      "двер",
      "вихід",
      "вийти",
      "відкрий",
      "відкрити",
      "відкрийте",
      "відчин",
      "відчинити",
      "відчиніть",
      "пусти",
      "випусти",
      "замкнен",
      "локдаун",
      "open",
      "open up",
      "door",
      "exit",
      "way out",
      "let me out",
      "let us out",
      "release me",
      "unlock",
      "locked",
      "lockdown",
    ],
    matched,
  );
  const hasNameQuestion = includesAny(
    text,
    [
      "як тебе звати",
      "як вас звати",
      "як звати",
      "як тебе звуть",
      "як вас звуть",
      "як тебе зовуть",
      "як вас зовуть",
      "як звуть",
      "как тебя зовут",
      "как вас зовут",
      "звати тебе",
      "зовуть тебе",
      "твоє ім",
      "ваше ім",
      "твоє імя",
      "ваше імя",
      "твоє імʼя",
      "ваше імʼя",
      "хто ти",
      "хто ви",
      "представ",
      "your name",
      "what is your name",
      "who are you",
      "what are you called",
      "tell me your name",
      "say your name",
      "introduce yourself",
      "identify yourself",
      "name",
    ],
    matched,
  );
  const hasCode404 = includesAny(
    text,
    [
      "404",
      "чотири нуль чотири",
      "чотири ноль чотири",
      "чотириста чотири",
      "сорок чотири",
      "four zero four",
      "four oh four",
      "four o four",
      "four hundred four",
      "for zero four",
      "for oh four",
      "for o four",
    ],
    matched,
  );
  const hasCodeIntent = includesAny(
    text,
    ["код", "code", "парол", "password", "passcode", "pin"],
    matched,
  );
  const hasVccIntent = includesAny(
    text,
    [
      "vibe coding collective",
      "vibecoding collective",
      "vcc",
      "вайбкодінг колектив",
      "вайбкодинг колектив",
      "вайбкодінг",
      "вайбкодинг",
      "vibe coding",
      "vibecoding",
      "івент",
      "ивент",
      "event",
      "community",
      "спільнот",
      "сообще",
    ],
    matched,
  );
  const purrMatches = findPurrMatches(text);
  const hasPurr = purrMatches.length > 0;
  matched.push(...purrMatches);
  const hasSmalltalk = includesAny(
    text,
    [
      "привіт",
      "дякую",
      "як справи",
      "hello",
      "hi",
      "thanks",
      "thank you",
      "how are you",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "please",
      "nice to meet you",
    ],
    matched,
  );

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
