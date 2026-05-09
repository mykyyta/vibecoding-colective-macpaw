import type { QuestActor, QuestLanguage, QuestState } from "../../../shared/voice.js";
import type { QuestTranscriptFacts } from "./classifier.js";
import { PERSONAS } from "../scenario/actors.js";
import { getQuestReply } from "../scenario/lines.js";

export function getChitchatActor(facts: QuestTranscriptFacts): QuestActor {
  if (facts.hasSofiaAddress || (!facts.hasDan && !facts.hasHoover && !facts.hasFixel)) {
    return "sofia";
  }

  if (facts.hasDan) return "dan";
  if (facts.hasHoover) return "hoover";
  if (facts.hasFixel) return "fixel";

  return "sofia";
}

export function getChitchatActors(): QuestActor[] {
  return ["sofia", "dan", "hoover", "fixel"];
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
