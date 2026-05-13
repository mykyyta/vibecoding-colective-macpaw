import type {
  QuestActor,
  QuestLanguage,
  QuestNameTagActor,
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
import { getQuestReply } from "../scenario/lines.js";
import type { QuestTranscriptFacts } from "./classifier.js";

// QuestTurn is structurally reproduced here to avoid a circular value import
// (index.ts imports createHeuristicFallbackTurn; fallback.ts must not import
// values from index.ts). TypeScript structural typing makes this compatible.
interface QuestTurnShape {
  action: VoiceAction;
  actor: QuestActor;
  event: QuestEvent;
  replyLanguage: QuestLanguage;
  reply: string;
  nameTagActors: QuestNameTagActor[];
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
    nameTagActors: defaultNameTagActors(transitionId, nextQuestState),
    previousQuestState,
    nextQuestState,
  };
}

function defaultNameTagActors(
  transitionId: QuestTransitionId,
  nextState: QuestState,
): QuestNameTagActor[] {
  const tags: QuestNameTagActor[] = [];

  if (nextState.sofiaIntroduced) {
    tags.push("sofia", "dan");
  }
  if (nextState.danBadgeAsked) {
    tags.push("hoover");
  }
  if (nextState.hooverClueGiven) {
    tags.push("fixel");
  }

  // Make sure progression-revealing transitions surface the freshly
  // activated character even though the heuristic fallback path can
  // run with state mid-transition.
  if (transitionId === "sofia-introduced") {
    return ensure(tags, ["sofia", "dan"]);
  }
  if (transitionId === "dan-badge-asked") {
    return ensure(tags, ["dan", "hoover"]);
  }
  if (transitionId === "hoover-clue-given") {
    return ensure(tags, ["hoover", "fixel"]);
  }

  return tags;
}

function ensure(
  base: QuestNameTagActor[],
  required: QuestNameTagActor[],
): QuestNameTagActor[] {
  const out = [...base];
  for (const tag of required) {
    if (!out.includes(tag)) {
      out.push(tag);
    }
  }
  return out;
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

  const actor = getChitchatActor(previousQuestState, facts);
  const reply = pickChitchatReply(actor, previousQuestState, facts, replyLanguage);
  return buildTurn("chitchat-replied", actor, reply, replyLanguage, previousQuestState);
}

function pickChitchatReply(
  actor: QuestActor,
  state: QuestState,
  facts: QuestTranscriptFacts,
  replyLanguage: QuestLanguage,
): string {
  // When a pre-activation cat address was redirected to Sofiia, use the
  // explicit redirect reply rather than the default Sofiia context line.
  if (actor === "sofia") {
    if (facts.hasHooverAddress && !state.danBadgeAsked) {
      return getQuestReply("pre-activation-hoover-redirect", replyLanguage);
    }
    if (facts.hasFixel && !state.hooverClueGiven) {
      return getQuestReply("pre-activation-fixel-redirect", replyLanguage);
    }
  }

  // Dan stall loop: between phase 1 and phase 2, any door/code/badge ask
  // without a loss-suggestion keeps Dan in denial.
  if (
    actor === "dan" &&
    state.danExplainedDoor &&
    !state.danBadgeAsked &&
    (facts.hasDoor || facts.hasCodeIntent) &&
    !facts.hasLossSuggestion
  ) {
    return getQuestReply("dan-stalling", replyLanguage);
  }

  return getChitchatFallbackReply(actor, state, replyLanguage);
}
