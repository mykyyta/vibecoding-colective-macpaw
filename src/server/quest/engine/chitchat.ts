import type { QuestActor, QuestLanguage, QuestState } from "../../../shared/voice.js";
import type { QuestTranscriptFacts } from "./classifier.js";
import { PERSONAS } from "../scenario/actors.js";
import { getQuestReply } from "../scenario/lines.js";

export function getChitchatActor(state: QuestState, facts: QuestTranscriptFacts): QuestActor {
  if (facts.hasSofiaAddress || (!facts.hasDan && !facts.hasHoover && !facts.hasFixel)) {
    return "sofia";
  }

  if (facts.hasDan) return "dan";

  // Pre-activation Hoover/Fixel addresses redirect to Sofiia.
  if (facts.hasHoover && state.danBadgeAsked) return "hoover";
  if (facts.hasFixel && state.hooverClueGiven) return "fixel";

  return "sofia";
}

export function getChitchatActors(state: QuestState): QuestActor[] {
  const actors: QuestActor[] = ["sofia", "dan"];

  if (state.danBadgeAsked) {
    actors.push("hoover");
  }

  if (state.hooverClueGiven) {
    actors.push("fixel");
  }

  return actors;
}

export function getChitchatFallbackReply(
  actor: QuestActor,
  state: QuestState,
  replyLanguage: QuestLanguage,
): string {
  if (state.doorOpen) {
    return getQuestReply("smalltalk-after-escape", replyLanguage);
  }

  return getQuestReply(PERSONAS[actor].chitchatFallback(state), replyLanguage);
}
