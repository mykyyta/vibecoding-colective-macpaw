export {
  canSynthesizeActorSpeech,
  getElevenLabsVoiceRole,
  getElevenLabsVoiceSettings,
  type ElevenLabsSpeechActor,
  type ElevenLabsVoiceRole,
  type ElevenLabsVoiceSettings,
} from "./voice-adapter.js";

export {
  buildQuestBrainPrompt,
  getOutputFormatBlock,
  getSceneBlock,
  getPersonasBlock,
} from "./prompt.js";

export {
  analyzeQuestTranscript,
  normalizeTranscript,
  findPurrMatches,
  type QuestTranscriptFacts,
} from "./classifier.js";

export {
  applyQuestTransition,
  findFirstLegalProgressingTransition,
  getAllowedQuestTransitions,
  isTransitionLegal,
  type AllowedQuestTransition,
  type ProgressingTransition,
  type QuestTransitionId,
} from "./transitions.js";

export { getChitchatActor, getChitchatActors, getChitchatFallbackReply } from "./chitchat.js";

export {
  replyPassesGuardrails,
  isAllowedQuestBrainReply,
  isAllowedSofiaReply,
  containsHooverReveal,
  containsFixelOrBadgeReveal,
  containsCodeReveal,
  containsDoorOpenClaim,
  normalizeForGuardrail,
} from "./guardrails.js";

export { initialQuestState, normalizeQuestState } from "./state.js";
export { decideQuestLanguage, type QuestLanguageDecisionRequest } from "./language.js";
export { parseClaudeQuestDecision, type ClaudeQuestDecision } from "./parser.js";
export { createHeuristicFallbackTurn } from "./fallback.js";
export { createQuestBrainTurn } from "./brain.js";
