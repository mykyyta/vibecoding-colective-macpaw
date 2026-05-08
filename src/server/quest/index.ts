import type {
  QuestActor,
  QuestEvent,
  QuestLanguage,
  QuestLanguageDecision,
  QuestLanguageInput,
  QuestState,
  QuestTrigger,
  VoiceAction,
} from "../../shared/voice.js";
import { getQuestReply } from "./content.js";
import { initialQuestState, normalizeQuestState } from "./state.js";
import {
  applyQuestTransition,
  getAllowedQuestTransitions,
  getChitchatActor,
  getChitchatFallbackReply,
  getSofiaHintReply,
  isTransitionLegal,
  type AllowedQuestTransition,
  type QuestTranscriptFacts,
  type QuestTransitionId,
} from "./transitions.js";

export {
  applyQuestTransition,
  getAllowedQuestTransitions,
  getChitchatFallbackReply,
  initialQuestState,
  isTransitionLegal,
  normalizeQuestState,
};
export type {
  AllowedQuestTransition,
  QuestState,
  QuestTranscriptFacts,
  QuestTransitionId,
};

export interface QuestTurn {
  action: VoiceAction;
  actor: QuestActor;
  event: QuestEvent;
  replyLanguage: QuestLanguage;
  reply: string;
  trigger: QuestTrigger;
  previousQuestState: QuestState;
  nextQuestState: QuestState;
}

export interface QuestTransitionTurnInput {
  transcript: string;
  questState?: Partial<QuestState>;
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  replyLanguage?: QuestLanguage;
}

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

export function createQuestTurn(
  transcript: string,
  questState: Partial<QuestState> = {},
  replyLanguage: QuestLanguage = DEFAULT_REPLY_LANGUAGE,
): QuestTurn {
  const previousQuestState = normalizeQuestState(questState);
  const trigger = classifyQuestTranscript(transcript);
  const nextQuestState = { ...previousQuestState };
  let actor: QuestActor = trigger.actor;
  let event: QuestEvent = { type: "chitchat-replied", progressed: false };
  let reply = "";

  switch (trigger.type) {
    case "ask-guard-name":
      actor = "guard";
      nextQuestState.olegNameKnown = true;
      event = { type: "oleg-name-learned", progressed: true };
      reply = getQuestReply("guard-name", replyLanguage);
      break;

    case "oleg-directed-door-command":
      actor = "guard";
      if (!previousQuestState.olegNameKnown) {
        reply = getQuestReply("guard-name-needed", replyLanguage);
        break;
      }

      nextQuestState.guardHintGiven = true;
      event = { type: "guard-hint-given", progressed: true };
      reply = getQuestReply("guard-hint", replyLanguage);
      break;

    case "pixel-directed-command":
      actor = "pixel";
      if (!previousQuestState.guardHintGiven) {
        reply = getQuestReply("pixel-smalltalk", replyLanguage);
        break;
      }

      nextQuestState.pixelRejectedOrdinaryCommand = true;
      event = { type: "pixel-ordinary-rejected", progressed: true };
      reply = getQuestReply("pixel-ordinary-rejected", replyLanguage);
      break;

    case "pixel-chitchat":
      actor = "pixel";
      reply = getQuestReply("pixel-smalltalk", replyLanguage);
      break;

    case "pixel-directed-purr":
      actor = "pixel";
      if (!previousQuestState.guardHintGiven) {
        reply = getQuestReply("pixel-purr-too-early", replyLanguage);
        break;
      }

      nextQuestState.codeRevealed = true;
      event = { type: "code-revealed", progressed: true };
      reply = getQuestReply("code-revealed", replyLanguage);
      break;

    case "oleg-directed-code":
      actor = "guard";
      if (!previousQuestState.olegNameKnown) {
        reply = getQuestReply("anonymous-code", replyLanguage);
        break;
      }

      if (!previousQuestState.codeRevealed) {
        reply = getQuestReply("code-not-revealed", replyLanguage);
        break;
      }

      nextQuestState.doorOpen = true;
      event = { type: "door-opened", progressed: true };
      actor = "door";
      reply = getQuestReply("door-opened", replyLanguage);
      break;

    case "generic-door-command":
      actor = "guard";
      reply = previousQuestState.olegNameKnown
        ? getQuestReply("generic-door-known", replyLanguage)
        : getQuestReply("generic-door-unknown", replyLanguage);
      break;

    case "purr-without-pixel":
      actor = "pixel";
      reply = previousQuestState.guardHintGiven
        ? getQuestReply("purr-without-pixel", replyLanguage)
        : getQuestReply("purr-without-pixel-before-hint", replyLanguage);
      break;

    case "sofia-hint-request":
      actor = "sofia";
      event = { type: "sofia-hint-given", progressed: false };
      reply = getSofiaHintReply(previousQuestState, replyLanguage);
      break;

    case "sofia-chitchat":
      actor = "sofia";
      reply = getSofiaConversationReply(trigger, replyLanguage);
      break;

    case "chitchat":
      actor = getChitchatActor(previousQuestState);
      reply = getChitchatFallbackReply(actor, previousQuestState, replyLanguage);
      break;

    case "unknown":
      actor = "system";
      reply = getQuestReply("unknown", replyLanguage);
      break;
  }

  return {
    action: { type: "none" },
    actor,
    event,
    replyLanguage,
    reply,
    trigger,
    previousQuestState,
    nextQuestState: normalizeQuestState(nextQuestState),
  };
}

function getSofiaConversationReply(
  trigger: QuestTrigger,
  replyLanguage: QuestLanguage,
): string {
  return hasVccConversationMatch(trigger.matched)
    ? getQuestReply("sofia-conversation-vcc", replyLanguage)
    : getQuestReply("sofia-conversation-smalltalk", replyLanguage);
}

function hasVccConversationMatch(matched: string[]): boolean {
  return matched.some((match) =>
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
    ].includes(match),
  );
}

export function createQuestTurnFromTransition({
  transcript,
  questState = {},
  transitionId,
  actor,
  reply,
  replyLanguage = DEFAULT_REPLY_LANGUAGE,
}: QuestTransitionTurnInput): QuestTurn {
  const previousQuestState = normalizeQuestState(questState);
  const nextQuestState = applyQuestTransition(previousQuestState, transitionId);
  const trigger = classifyQuestTranscript(transcript);
  const progressed = !["chitchat-replied", "sofia-hint-given"].includes(
    transitionId,
  );

  return {
    action: { type: "none" },
    actor,
    event: { type: transitionId, progressed },
    replyLanguage,
    reply,
    trigger,
    previousQuestState,
    nextQuestState,
  };
}

export function classifyQuestTranscript(transcript: string): QuestTrigger {
  const facts = analyzeQuestTranscript(transcript);
  const {
    hasOleg,
    hasPixel,
    hasCatAddress,
    hasSofiaAddress,
    hasDoor,
    hasNameQuestion,
    hasCode404,
    hasCodeIntent,
    hasVccIntent,
    hasPurr,
    hasSmalltalk,
    matched,
    text,
  } = facts;

  if (
    hasSofiaAddress ||
    (hasVccIntent &&
      (hasNameQuestion || text.includes("що таке") || text.includes("what is")))
  ) {
    return {
      type: "sofia-chitchat",
      actor: "sofia",
      directAddress: hasSofiaAddress,
      matched,
    };
  }

  if (hasPixel && hasPurr) {
    return {
      type: "pixel-directed-purr",
      actor: "pixel",
      directAddress: true,
      matched,
    };
  }

  if (hasOleg && hasCode404) {
    return {
      type: "oleg-directed-code",
      actor: "guard",
      directAddress: true,
      matched,
    };
  }

  if (hasOleg && (hasDoor || hasCodeIntent)) {
    return {
      type: "oleg-directed-door-command",
      actor: "guard",
      directAddress: true,
      matched,
    };
  }

  if (hasPixel || hasCatAddress) {
    return {
      type:
        (hasCodeIntent || hasDoor) && hasPixel
          ? "pixel-directed-command"
          : "pixel-chitchat",
      actor: "pixel",
      directAddress: true,
      matched,
    };
  }

  if (hasNameQuestion) {
    return {
      type: "ask-guard-name",
      actor: "guard",
      directAddress: false,
      matched,
    };
  }

  if (hasDoor) {
    return {
      type: "generic-door-command",
      actor: "guard",
      directAddress: false,
      matched,
    };
  }

  if (hasPurr) {
    return {
      type: "purr-without-pixel",
      actor: "pixel",
      directAddress: false,
      matched,
    };
  }

  if (hasSmalltalk) {
    return {
      type: "chitchat",
      actor: "guard",
      directAddress: false,
      matched,
    };
  }

  return {
    type: "unknown",
    actor: "system",
    directAddress: false,
    matched,
  };
}

export function analyzeQuestTranscript(transcript: string): QuestTranscriptFacts {
  const text = normalizeTranscript(transcript);
  const matched: string[] = [];
  const hasOleg = includesAny(
    text,
    ["олег", "олєг", "оліг", "олек", "олеж", "олежа", "oleg", "oleh", "olek"],
    matched,
  );
  const hasPixel = includesAny(
    text,
    [
      "pixel",
      "pixels",
      "піксель",
      "пиксель",
      "піксел",
      "пиксел",
      "піксіл",
      "пиксил",
      "піксі",
      "пикси",
      "пікс",
      "пикс",
      "pix",
      "kitty",
      "kitten",
      "the cat",
      "fluffy",
      "furball",
    ],
    matched,
  );
  const hasCatAddress = includesAny(
    text,
    [
      "кіт",
      "котик",
      "котику",
      "кот",
      "киця",
      "кицю",
      "кіцю",
      "пухнастий",
      "пухнаст",
      "хвостатий",
      "хвостат",
      "муркотун",
      "мурчику",
      "cat",
      "kitty",
      "kitten",
      "the cat",
      "fluffy",
      "furball",
    ],
    matched,
  );
  const hasSofia = includesAny(
    text,
    [
      "софія",
      "софия",
      "софіє",
      "софие",
      "софі",
      "софи",
      "sofia",
      "sofiia",
      "sophia",
    ],
    matched,
  );
  const hasFeminineAddress = includesAny(
    text,
    [
      "дівчино",
      "дівчина",
      "девушка",
      "пані",
      "леді",
      "мисс",
      "жінко",
      "женщина",
      "організаторка",
      "організаторко",
      "організатор",
      "организатор",
      "дизайнерко",
      "product designer",
      "designer",
      "organizer",
      "girl",
      "lady",
      "woman",
      "ma'am",
      "maam",
      "madam",
    ],
    matched,
  );
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

function normalizeTranscript(transcript: string): string {
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

function findPurrMatches(text: string): string[] {
  const matches = text.matchAll(
    /(?<=^|[^\p{L}\p{N}_])(мур[\p{L}]*|муркот[\p{L}]*|промур[\p{L}]*|помур[\p{L}]*|мрр+|мр+|мяу[\p{L}]*|мяв[\p{L}]*|м[\s-]?я[\s-]?у+|нявк[\p{L}]*|нявч[\p{L}]*|няв+|няу+|н[\s-]?я[\s-]?у+|пур[\p{L}]*|пурр+|пурч[\p{L}]*|пурн[\p{L}]*|пр+|purr[\p{L}]*|pur+|mur[\p{L}]*|meow[\p{L}]*|mew+|mrow+|nya[\p{L}]*|nyan+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+|mrr+)(?=$|[^\p{L}\p{N}_])/gu,
  );

  return [...matches].map((match) => match[1]).filter(Boolean);
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
