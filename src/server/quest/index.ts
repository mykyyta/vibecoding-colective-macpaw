import type {
  QuestActor,
  QuestEvent,
  QuestLanguage,
  QuestState,
  QuestTrigger,
  VoiceAction,
} from "../../shared/voice.js";
import {
  analyzeQuestTranscript,
  type QuestTranscriptFacts,
} from "./classifier.js";
import { getQuestReply } from "./content.js";
import { decideQuestLanguage, type QuestLanguageDecisionRequest } from "./language.js";
import { initialQuestState, normalizeQuestState } from "./state.js";
import {
  applyQuestTransition,
  getAllowedQuestTransitions,
  getChitchatActor,
  getChitchatFallbackReply,
  getSofiaHintReply,
  isTransitionLegal,
  type AllowedQuestTransition,
  type QuestTransitionId,
} from "./transitions.js";

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

const DEFAULT_REPLY_LANGUAGE: QuestLanguage = "uk";

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

