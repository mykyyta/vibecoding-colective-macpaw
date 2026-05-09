import type {
  QuestActor,
  QuestEventType,
  QuestLanguage,
  QuestState,
} from "../../../shared/voice.js";
import type { QuestTranscriptFacts } from "./classifier.js";
import { MOVE_SCENARIO_DATA } from "../scenario/moves.js";
import { getSofiaHintReplyId, getSofiaHintStageContext } from "../scenario/hints.js";
import { getQuestReply } from "../scenario/lines.js";
import { normalizeQuestState } from "../state.js";
import { getChitchatActor, getChitchatActors, getChitchatFallbackReply } from "./chitchat.js";

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

const TRANSITIONS: TransitionRecord[] = [
  {
    id: "chitchat-replied",
    actor: getChitchatActor,
    allowedActors: () => getChitchatActors(),
    isAvailable: () => true,
    apply: (state) => state,
    describe: (state, lang) => MOVE_SCENARIO_DATA["chitchat-replied"].describe(state, lang),
    fallbackReply: (state, lang) =>
      getChitchatFallbackReply(getChitchatActor(state), state, lang),
  },
  {
    id: "sofia-hint-given",
    actor: () => "sofia",
    isAvailable: () => true,
    factsCheck: (_state, facts) => facts.hasSofiaAddress,
    apply: (state) => state,
    describe: (state, _lang) =>
      [
        "Use when the player directly addresses Sofiia and semantically asks for a quest idea, hint, help, advice, direction, or next step.",
        "This requires a direct Sofiia address by name or feminine address; unaddressed help requests are not Sofiia hints.",
        "Do not use this for ordinary Sofiia conversation, door comments, code comments, or VCC/vibe-coding questions unless the player clearly asks for a hint.",
        "Sofiia is not the quest organizer or answer holder: she gives a calming facilitation idea, does not sound certain, does not mention stages or mechanics, and does not advance state.",
        getSofiaHintStageContext(state),
      ].join(" "),
    fallbackReply: (state, lang) =>
      getQuestReply(getSofiaHintReplyId(state), lang),
  },
  {
    id: "oleg-name-learned",
    actor: () => "guard",
    isAvailable: (state) => !state.olegNameKnown,
    factsCheck: (_state, facts) => facts.hasNameQuestion,
    apply: (state) => ({ ...state, olegNameKnown: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["oleg-name-learned"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["oleg-name-learned"].fallbackLineId!, lang),
  },
  {
    id: "guard-hint-given",
    actor: () => "guard",
    isAvailable: (state) => state.olegNameKnown && !state.guardHintGiven,
    factsCheck: (_state, facts) =>
      facts.hasOleg && (facts.hasDoor || facts.hasCodeIntent),
    apply: (state) => ({ ...state, guardHintGiven: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["guard-hint-given"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["guard-hint-given"].fallbackLineId!, lang),
  },
  {
    id: "pixel-ordinary-rejected",
    actor: () => "pixel",
    isAvailable: (state) =>
      state.guardHintGiven && !state.pixelRejectedOrdinaryCommand,
    factsCheck: (_state, facts) => facts.hasPixel,
    apply: (state) => ({ ...state, pixelRejectedOrdinaryCommand: true }),
    describe: (state, lang) =>
      MOVE_SCENARIO_DATA["pixel-ordinary-rejected"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["pixel-ordinary-rejected"].fallbackLineId!, lang),
  },
  {
    id: "code-revealed",
    actor: () => "pixel",
    isAvailable: (state) => state.guardHintGiven && !state.codeRevealed,
    factsCheck: (_state, facts) => facts.hasPixel && facts.hasPurr,
    apply: (state) => ({ ...state, codeRevealed: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["code-revealed"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["code-revealed"].fallbackLineId!, lang),
  },
  {
    id: "door-opened",
    actor: () => "door",
    isAvailable: (state) =>
      state.olegNameKnown && state.codeRevealed && !state.doorOpen,
    factsCheck: (_state, facts) => facts.hasOleg && facts.hasCode404,
    apply: (state) => ({ ...state, doorOpen: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["door-opened"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["door-opened"].fallbackLineId!, lang),
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
