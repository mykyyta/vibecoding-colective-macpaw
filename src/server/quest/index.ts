import type {
  QuestActor,
  QuestEvent,
  QuestLanguage,
  QuestState,
  VoiceAction,
} from "../../shared/voice.js";
import {
  analyzeQuestTranscript,
  type QuestTranscriptFacts,
} from "./engine/classifier.js";
import { createHeuristicFallbackTurn } from "./fallback.js";
import { decideQuestLanguage, type QuestLanguageDecisionRequest } from "./language.js";
import { initialQuestState, normalizeQuestState } from "./state.js";
import {
  applyQuestTransition,
  getAllowedQuestTransitions,
  isTransitionLegal,
  type AllowedQuestTransition,
  type QuestTransitionId,
} from "./engine/transitions.js";
import { getChitchatFallbackReply } from "./engine/chitchat.js";

export {
  analyzeQuestTranscript,
  applyQuestTransition,
  decideQuestLanguage,
  getAllowedQuestTransitions,
  getChitchatFallbackReply,
  initialQuestState,
  isTransitionLegal,
  normalizeQuestState,
};

export type {
  AllowedQuestTransition,
  QuestLanguageDecisionRequest,
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

const DEFAULT_REPLY_LANGUAGE: QuestLanguage = "uk";

export function createQuestTurn(
  transcript: string,
  questState: Partial<QuestState> = {},
  replyLanguage: QuestLanguage = DEFAULT_REPLY_LANGUAGE,
): QuestTurn {
  return createHeuristicFallbackTurn(transcript, questState, replyLanguage);
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
  const progressed = !["chitchat-replied", "sofia-hint-given"].includes(
    transitionId,
  );

  return {
    action: { type: "none" },
    actor,
    event: { type: transitionId, progressed },
    replyLanguage,
    reply,
    previousQuestState,
    nextQuestState,
  };
}

