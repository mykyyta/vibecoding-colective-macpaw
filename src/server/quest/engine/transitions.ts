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
import { normalizeQuestState } from "./state.js";
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
  actor: (state: QuestState, facts: QuestTranscriptFacts) => QuestActor;
  fallbackReply: (state: QuestState, replyLanguage: QuestLanguage) => string;
}

interface TransitionRecord {
  id: QuestTransitionId;
  actor: (state: QuestState, facts: QuestTranscriptFacts) => QuestActor;
  allowedActors?: (state: QuestState) => QuestActor[];
  isAvailable: (state: QuestState) => boolean;
  factsCheck?: (state: QuestState, facts: QuestTranscriptFacts) => boolean;
  apply: (state: QuestState) => QuestState;
  describe: (state: QuestState, replyLanguage: QuestLanguage) => string;
  fallbackReply: (state: QuestState, replyLanguage: QuestLanguage) => string;
}

const TRANSITIONS: TransitionRecord[] = [
  {
    id: "sofia-introduced",
    actor: () => "sofia",
    isAvailable: (state) => !state.sofiaIntroduced,
    factsCheck: () => true,
    apply: (state) => ({ ...state, sofiaIntroduced: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["sofia-introduced"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["sofia-introduced"].fallbackLineId!, lang),
  },
  {
    id: "chitchat-replied",
    actor: (state, facts) => getChitchatActor(state, facts),
    allowedActors: (state) => getChitchatActors(state),
    isAvailable: (state) => state.sofiaIntroduced,
    apply: (state) => state,
    describe: (state, lang) => MOVE_SCENARIO_DATA["chitchat-replied"].describe(state, lang),
    fallbackReply: (state, lang) =>
      getChitchatFallbackReply("sofia", state, lang),
  },
  {
    id: "sofia-hint-given",
    actor: () => "sofia",
    isAvailable: (state) => state.sofiaIntroduced,
    factsCheck: (_state, facts) => facts.hasSofiaAddress && facts.hasHintIntent,
    apply: (state) => state,
    describe: (state, _lang) =>
      [
        MOVE_SCENARIO_DATA["sofia-hint-given"].describe(state, _lang),
        getSofiaHintStageContext(state),
      ].join(" "),
    fallbackReply: (state, lang) =>
      getQuestReply(getSofiaHintReplyId(state), lang),
  },
  {
    id: "dan-badge-asked",
    actor: () => "dan",
    isAvailable: (state) => state.sofiaIntroduced && !state.danBadgeAsked,
    factsCheck: (_state, facts) =>
      facts.hasDan && (facts.hasDoor || facts.hasCodeIntent),
    apply: (state) => ({ ...state, danBadgeAsked: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["dan-badge-asked"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["dan-badge-asked"].fallbackLineId!, lang),
  },
  {
    id: "hoover-ordinary-rejected",
    actor: () => "hoover",
    isAvailable: (state) => state.danBadgeAsked && !state.hooverClueGiven,
    factsCheck: (_state, facts) =>
      facts.hasHoover && !facts.hasGentleHooverAddress,
    apply: (state) => state,
    describe: (state, lang) =>
      MOVE_SCENARIO_DATA["hoover-ordinary-rejected"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["hoover-ordinary-rejected"].fallbackLineId!, lang),
  },
  {
    id: "hoover-clue-given",
    actor: () => "hoover",
    isAvailable: (state) => state.danBadgeAsked && !state.hooverClueGiven,
    factsCheck: (_state, facts) =>
      facts.hasHoover && facts.hasGentleHooverAddress,
    apply: (state) => ({ ...state, hooverClueGiven: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["hoover-clue-given"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["hoover-clue-given"].fallbackLineId!, lang),
  },
  {
    id: "fixel-sleeping-rejected",
    actor: () => "fixel",
    isAvailable: (state) => state.hooverClueGiven && !state.codeRevealed,
    factsCheck: (_state, facts) => facts.hasFixel && !facts.hasWakeAttempt,
    apply: (state) => state,
    describe: (state, lang) =>
      MOVE_SCENARIO_DATA["fixel-sleeping-rejected"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["fixel-sleeping-rejected"].fallbackLineId!, lang),
  },
  {
    id: "code-revealed",
    actor: () => "fixel",
    isAvailable: (state) => state.hooverClueGiven && !state.codeRevealed,
    factsCheck: (_state, facts) => facts.hasFixel && facts.hasWakeAttempt,
    apply: (state) => ({ ...state, codeRevealed: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["code-revealed"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["code-revealed"].fallbackLineId!, lang),
  },
  {
    id: "door-opened",
    actor: () => "dan",
    isAvailable: (state) => state.codeRevealed && !state.doorOpen,
    factsCheck: (_state, facts) => facts.hasDan && facts.hasCode404,
    apply: (state) => ({ ...state, doorOpen: true }),
    describe: (state, lang) => MOVE_SCENARIO_DATA["door-opened"].describe(state, lang),
    fallbackReply: (_state, lang) =>
      getQuestReply(MOVE_SCENARIO_DATA["door-opened"].fallbackLineId!, lang),
  },
];

const FALLBACK_CANDIDATE_TRANSITIONS = [
  "sofia-introduced",
  "dan-badge-asked",
  "hoover-clue-given",
  "hoover-ordinary-rejected",
  "code-revealed",
  "fixel-sleeping-rejected",
  "door-opened",
] as const;

export function findFirstLegalProgressingTransition(
  state: QuestState,
  facts: QuestTranscriptFacts,
): ProgressingTransition | undefined {
  return TRANSITIONS.find(
    (t) =>
      (FALLBACK_CANDIDATE_TRANSITIONS as readonly string[]).includes(t.id) &&
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
      actor: record.actor(state, {
        text: "",
        matched: [],
        hasDan: false,
        hasHoover: false,
        hasFixel: false,
        hasCatAddress: false,
        hasSofia: false,
        hasFeminineAddress: false,
        hasSofiaAddress: false,
        hasDoor: false,
        hasCode404: false,
        hasCodeIntent: false,
        hasHintIntent: false,
        hasVccIntent: false,
        hasGentleHooverAddress: false,
        hasWakeAttempt: false,
        hasSmalltalk: false,
      }),
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
