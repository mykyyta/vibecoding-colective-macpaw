import type {
  QuestActor,
  QuestEvent,
  QuestEventType,
  QuestLanguage,
  QuestLanguageDecision,
  QuestLanguageInput,
  QuestState,
  QuestTrigger,
  VoiceAction,
} from "../shared/voice.js";
import {
  CANNED_REPLIES,
  FINAL_DOOR_LINE,
  type QuestReplyId,
} from "./quest-content.js";

export type QuestTransitionId = QuestEventType;

export interface AllowedQuestTransition {
  id: QuestTransitionId;
  actor: QuestActor;
  allowedActors?: QuestActor[];
  description: string;
  fallbackReply: string;
}

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

export const initialQuestState: QuestState = {
  olegNameKnown: false,
  guardHintGiven: false,
  pixelAddressed: false,
  pixelRejectedOrdinaryCommand: false,
  codeRevealed: false,
  doorOpen: false,
  escaped: false,
};

const DEFAULT_REPLY_LANGUAGE: QuestLanguage = "uk";
const HIGH_CONFIDENCE_LANGUAGE_THRESHOLD = 0.75;
const HEURISTIC_LANGUAGE_THRESHOLD = 0.62;

export function normalizeQuestState(
  state: Partial<QuestState> | null | undefined = {},
): QuestState {
  const source = state && typeof state === "object" ? state : {};
  const olegNameKnown = source.olegNameKnown === true;
  const guardHintGiven = source.guardHintGiven === true && olegNameKnown;
  const pixelRejectedOrdinaryCommand =
    source.pixelRejectedOrdinaryCommand === true && guardHintGiven;
  const codeRevealed = source.codeRevealed === true && guardHintGiven;
  const doorOpen = source.doorOpen === true && olegNameKnown && codeRevealed;

  return {
    olegNameKnown,
    guardHintGiven,
    pixelAddressed: pixelRejectedOrdinaryCommand || codeRevealed,
    pixelRejectedOrdinaryCommand,
    codeRevealed,
    doorOpen,
    escaped: doorOpen,
  };
}

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

interface TransitionRecord {
  id: QuestTransitionId;
  actor: (state: QuestState) => QuestActor;
  allowedActors?: (state: QuestState) => QuestActor[];
  isAvailable: (state: QuestState) => boolean;
  factsCheck?: (state: QuestState, facts: QuestTranscriptFacts) => boolean;
  apply: (state: QuestState) => QuestState;
  describe: (state: QuestState, replyLanguage: QuestLanguage) => string;
  fallbackReply: (state: QuestState, replyLanguage: QuestLanguage) => string;
}

const TRANSITIONS: TransitionRecord[] = [
  {
    id: "chitchat-replied",
    actor: getChitchatActor,
    allowedActors: () => getChitchatActors(),
    isAvailable: () => true,
    apply: (state) => state,
    describe: () =>
      [
        "Use for any player turn that should not progress the quest:",
        "greetings, thanks, jokes, ordinary conversation with any character,",
        "questions about a character, comments about the room or door,",
        "questions about Vibe Coding Collective / vibe coding / the event,",
        "or ambiguous and unintelligible input.",
        "Pick the actor who is being addressed; if no clear address, pick the",
        "most relevant visible character (guard early, Pixel once engaged,",
        "door after escape, sofia for VCC and Sofiia-directed comments).",
        "Sofiia may answer here from her persona including a brief VCC",
        "explanation if asked, but she must not give a quest-step hint:",
        "if the player asks Sofiia for help, choose sofia-hint-given instead.",
      ].join(" "),
    fallbackReply: (state, lang) =>
      getChitchatFallbackReply(getChitchatActor(state), state, lang),
  },
  {
    id: "sofia-hint-given",
    actor: () => "sofia",
    isAvailable: () => true,
    factsCheck: (_state, facts) => facts.hasSofiaAddress,
    apply: (state) => state,
    describe: (state) =>
      [
        "Use when the player directly addresses Sofiia and semantically asks for a quest idea, hint, help, advice, direction, or next step.",
        "This requires a direct Sofiia address by name or feminine address; unaddressed help requests are not Sofiia hints.",
        "Do not use this for ordinary Sofiia conversation, door comments, code comments, or VCC/vibe-coding questions unless the player clearly asks for a hint.",
        "Sofiia is not the quest organizer or answer holder: she gives a calming facilitation idea, does not sound certain, does not mention stages or mechanics, and does not advance state.",
        getSofiaHintStageContext(state),
      ].join(" "),
    fallbackReply: getSofiaHintReply,
  },
  {
    id: "oleg-name-learned",
    actor: () => "guard",
    isAvailable: (state) => !state.olegNameKnown,
    factsCheck: (_state, facts) => facts.hasNameQuestion,
    apply: (state) => ({ ...state, olegNameKnown: true }),
    describe: () =>
      "The player asks the guard's name or who he is. This is the only transition that may reveal the guard is Oleg. The spoken reply must explicitly include the name Oleg/Олег because name-based address is the core puzzle key.",
    fallbackReply: (_state, lang) => getQuestReply("guard-name", lang),
  },
  {
    id: "guard-hint-given",
    actor: () => "guard",
    isAvailable: (state) => state.olegNameKnown && !state.guardHintGiven,
    factsCheck: (_state, facts) =>
      facts.hasOleg && (facts.hasDoor || facts.hasCodeIntent),
    apply: (state) => ({ ...state, guardHintGiven: true }),
    describe: (_state, lang) => {
      const eventPhrase =
        lang === "en" ? "vibecoding event" : "вайбкодінг івент";

      return `The player directly addresses Oleg and asks him to open/unlock the door or help with the exit/code. The spoken reply must explicitly include the cat's name Pixel/Піксель because this is the key clue for the next step. This may reveal that the exit is locked after the ${eventPhrase} and Pixel's exit-panel clue, but not the code.`;
    },
    fallbackReply: (_state, lang) => getQuestReply("guard-hint", lang),
  },
  {
    id: "pixel-ordinary-rejected",
    actor: () => "pixel",
    isAvailable: (state) =>
      state.guardHintGiven && !state.pixelRejectedOrdinaryCommand,
    factsCheck: (_state, facts) => facts.hasPixel,
    apply: (state) => ({ ...state, pixelRejectedOrdinaryCommand: true }),
    describe: () =>
      "The player directly addresses Pixel by name with an ordinary command, request, or question, including asking for the code without making a cat sound. Pixel acknowledges the address but refuses ordinary commands.",
    fallbackReply: (_state, lang) =>
      getQuestReply("pixel-ordinary-rejected", lang),
  },
  {
    id: "code-revealed",
    actor: () => "pixel",
    isAvailable: (state) => state.guardHintGiven && !state.codeRevealed,
    factsCheck: (_state, facts) => facts.hasPixel && facts.hasPurr,
    apply: (state) => ({ ...state, codeRevealed: true }),
    describe: () =>
      "Use only when the player directly says Pixel's name or a clear Pixel alias and also performs a gentle cat sound in the same transcript, such as mur, mrr, meow, purr, pur, prr, nya/няв/мяу, or similar. Do not use for ordinary commands like asking Pixel for the code without a cat sound. This is the only transition that may reveal code 404.",
    fallbackReply: (_state, lang) => getQuestReply("code-revealed", lang),
  },
  {
    id: "door-opened",
    actor: () => "door",
    isAvailable: (state) =>
      state.olegNameKnown && state.codeRevealed && !state.doorOpen,
    factsCheck: (_state, facts) => facts.hasOleg && facts.hasCode404,
    apply: (state) => ({ ...state, doorOpen: true }),
    describe: () =>
      "The player directly addresses Oleg and gives the already revealed code 404. This is the only transition that may open the door or mark escape. The reply should use this exact final line: 404 accepted. Door not found, but exit found.",
    fallbackReply: (_state, lang) => getQuestReply("door-opened", lang),
  },
];

function findTransition(id: QuestTransitionId): TransitionRecord | undefined {
  return TRANSITIONS.find((record) => record.id === id);
}

export function isTransitionLegal(
  id: QuestTransitionId,
  state: QuestState,
  facts: QuestTranscriptFacts,
): boolean {
  const record = findTransition(id);

  if (!record || !record.isAvailable(state)) {
    return false;
  }

  return record.factsCheck?.(state, facts) ?? true;
}

export function getAllowedQuestTransitions(
  questState: Partial<QuestState> = {},
  replyLanguage: QuestLanguage = DEFAULT_REPLY_LANGUAGE,
): AllowedQuestTransition[] {
  const state = normalizeQuestState(questState);

  return TRANSITIONS.filter((record) => record.isAvailable(state)).map(
    (record) => ({
      id: record.id,
      actor: record.actor(state),
      allowedActors: record.allowedActors?.(state),
      description: record.describe(state, replyLanguage),
      fallbackReply: record.fallbackReply(state, replyLanguage),
    }),
  );
}

function getChitchatActor(state: QuestState): QuestActor {
  if (state.doorOpen || state.escaped) {
    return "door";
  }

  if (state.pixelAddressed) {
    return "pixel";
  }

  return "guard";
}

function getChitchatActors(): QuestActor[] {
  return ["guard", "pixel", "sofia", "door", "system"];
}

export function getChitchatFallbackReply(
  actor: QuestActor,
  state: QuestState,
  replyLanguage: QuestLanguage,
): string {
  if (state.doorOpen || state.escaped) {
    return getQuestReply("smalltalk-after-escape", replyLanguage);
  }

  if (actor === "sofia") {
    return getQuestReply("sofia-conversation-smalltalk", replyLanguage);
  }

  if (actor === "pixel") {
    return state.pixelAddressed
      ? getQuestReply("smalltalk-pixel", replyLanguage)
      : getQuestReply("pixel-smalltalk", replyLanguage);
  }

  if (actor === "system") {
    return getQuestReply("unknown", replyLanguage);
  }

  return state.olegNameKnown
    ? getQuestReply("smalltalk-guard-known", replyLanguage)
    : getQuestReply("smalltalk-guard-unknown", replyLanguage);
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

function getSofiaHintReply(
  state: QuestState,
  replyLanguage: QuestLanguage,
): string {
  if (state.doorOpen || state.escaped) {
    return getQuestReply("sofia-hint-after-escape", replyLanguage);
  }

  if (state.codeRevealed) {
    return getQuestReply("sofia-hint-code-revealed", replyLanguage);
  }

  if (state.pixelRejectedOrdinaryCommand) {
    return getQuestReply("sofia-hint-pixel-rejected", replyLanguage);
  }

  if (state.guardHintGiven) {
    return getQuestReply("sofia-hint-guard-clue", replyLanguage);
  }

  if (state.olegNameKnown) {
    return getQuestReply("sofia-hint-oleg-known", replyLanguage);
  }

  return getQuestReply("sofia-hint-initial", replyLanguage);
}

function getSofiaHintStageContext(state: QuestState): string {
  if (state.doorOpen || state.escaped) {
    return "Current Sofiia hint stage: the player has already escaped. Reflect on the shared exit and keep it celebratory, not instructional.";
  }

  if (state.codeRevealed) {
    return "Current Sofiia hint stage: the code is already known. Nudge the player to give the code to the person standing between them and the door, without saying this is a mechanic.";
  }

  if (state.pixelRejectedOrdinaryCommand) {
    return "Current Sofiia hint stage: Pixel rejected ordinary human requests. Nudge the player to try Pixel's own language or a cat-like sound, without revealing the code.";
  }

  if (state.guardHintGiven) {
    return "Current Sofiia hint stage: Oleg already pointed toward Pixel. Nudge the player only to address Pixel directly and try talking to him calmly. Do not suggest cat language, cat sounds, purring, meowing, or Pixel's own language yet.";
  }

  if (state.olegNameKnown) {
    return "Current Sofiia hint stage: the player knows the guard is Oleg. Nudge the player to address Oleg directly about the exit, not to speak to the room in general.";
  }

  return "Current Sofiia hint stage: the player has not learned the guard's name. Nudge the player to start with a human introduction or ask the person near the door who he is.";
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

function applyQuestTransition(
  previousQuestState: QuestState,
  transitionId: QuestTransitionId,
): QuestState {
  const record = findTransition(transitionId);

  if (!record) {
    return previousQuestState;
  }

  return normalizeQuestState(record.apply(previousQuestState));
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
    /(?:^|\s)(мур+|мурк\w*|м(?:[\s-]?р)+|мр+|мяу+|мяв+|м[\s-]?я[\s-]?у+|няу+|няв+|н[\s-]?я[\s-]?у+|пур+|пурр+|пр+|purr+|purring|pur+|mur+|meow+|meowing|mew+|mrow+|nya+|nyan+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+)(?=\s|$)/g,
  );

  return [...matches].map((match) => match[1]).filter(Boolean);
}

function getQuestReply(
  replyId: QuestReplyId,
  replyLanguage: QuestLanguage,
): string {
  return CANNED_REPLIES[replyId][replyLanguage] ?? CANNED_REPLIES[replyId].uk;
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
