import type {
  QuestActor,
  QuestEventType,
  QuestLanguage,
  QuestState,
} from "../../shared/voice.js";
import type { QuestTranscriptFacts } from "./classifier.js";
import { PERSONAS } from "./personas.js";
import { getQuestReply } from "./replies.js";
import { normalizeQuestState } from "./state.js";

export type QuestTransitionId = QuestEventType;

export interface AllowedQuestTransition {
  id: QuestTransitionId;
  actor: QuestActor;
  allowedActors?: QuestActor[];
  description: string;
  fallbackReply: string;
}

export interface ProgressingTransition {
  id: QuestTransitionId;
  actor: (state: QuestState) => QuestActor;
  fallbackReply: (state: QuestState, replyLanguage: QuestLanguage) => string;
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

export function getChitchatActor(state: QuestState): QuestActor {
  if (state.doorOpen || state.escaped) {
    return "door";
  }

  if (state.pixelAddressed) {
    return "pixel";
  }

  return "guard";
}

export function getChitchatActors(): QuestActor[] {
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

  return getQuestReply(PERSONAS[actor].chitchatFallback(state), replyLanguage);
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

export function getSofiaHintReply(
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

const PROGRESSING_TRANSITIONS = [
  "oleg-name-learned",
  "guard-hint-given",
  "pixel-ordinary-rejected",
  "code-revealed",
  "door-opened",
] as const;

export function findFirstLegalProgressingTransition(
  state: QuestState,
  facts: QuestTranscriptFacts,
): ProgressingTransition | undefined {
  return TRANSITIONS.find(
    (t) =>
      (PROGRESSING_TRANSITIONS as readonly string[]).includes(t.id) &&
      t.isAvailable(state) &&
      (t.factsCheck?.(state, facts) ?? false),
  );
}

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
  replyLanguage: QuestLanguage = "uk",
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

export function applyQuestTransition(
  previousQuestState: QuestState,
  transitionId: QuestTransitionId,
): QuestState {
  const record = findTransition(transitionId);

  if (!record) {
    return previousQuestState;
  }

  return normalizeQuestState(record.apply(previousQuestState));
}
