import type { QuestActor, QuestLanguage, QuestState } from "../../../shared/voice.js";
import { PERSONAS } from "../scenario/actors.js";
import { getQuestReply } from "../scenario/lines.js";

export function getChitchatActor(state: QuestState): QuestActor {
  if (state.doorOpen) {
    return "door";
  }

  if (state.pixelRejectedOrdinaryCommand || state.codeRevealed) {
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
  if (state.doorOpen) {
    return getQuestReply("smalltalk-after-escape", replyLanguage);
  }

  return getQuestReply(PERSONAS[actor].chitchatFallback(state), replyLanguage);
}
