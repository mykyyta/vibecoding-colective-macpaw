import type {
  QuestActor,
  QuestLanguage,
  QuestState,
  VoiceAction,
  QuestEvent,
} from "../../../shared/voice.js";
import { analyzeQuestTranscript } from "./classifier.js";
import { normalizeQuestState } from "./state.js";
import type { QuestTransitionId } from "./transitions.js";
import {
  applyQuestTransition,
  findFirstLegalProgressingTransition,
} from "./transitions.js";
import { getChitchatActor, getChitchatFallbackReply } from "./chitchat.js";

// QuestTurn is structurally reproduced here to avoid a circular value import
// (index.ts imports createHeuristicFallbackTurn; fallback.ts must not import
// values from index.ts). TypeScript structural typing makes this compatible.
interface QuestTurnShape {
  action: VoiceAction;
  actor: QuestActor;
  event: QuestEvent;
  replyLanguage: QuestLanguage;
  reply: string;
  previousQuestState: QuestState;
  nextQuestState: QuestState;
}

function buildTurn(
  transitionId: QuestTransitionId,
  actor: QuestActor,
  reply: string,
  replyLanguage: QuestLanguage,
  previousQuestState: QuestState,
): QuestTurnShape {
  const nextQuestState = applyQuestTransition(previousQuestState, transitionId);
  const progressed = ![
    "chitchat-replied",
    "sofia-hint-given",
    "hoover-ordinary-rejected",
    "fixel-sleeping-rejected",
  ].includes(transitionId);

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

export function createHeuristicFallbackTurn(
  transcript: string,
  questState: Partial<QuestState>,
  replyLanguage: QuestLanguage,
): QuestTurnShape {
  const previousQuestState = normalizeQuestState(questState);
  const facts = analyzeQuestTranscript(transcript);

  const progressing = findFirstLegalProgressingTransition(previousQuestState, facts);
  if (progressing) {
    return buildTurn(
      progressing.id,
      progressing.actor(previousQuestState, facts),
      progressing.fallbackReply(previousQuestState, replyLanguage),
      replyLanguage,
      previousQuestState,
    );
  }

  const actor = getChitchatActor(facts);
  const reply = getChitchatFallbackReply(actor, previousQuestState, replyLanguage);
  return buildTurn("chitchat-replied", actor, reply, replyLanguage, previousQuestState);
}
