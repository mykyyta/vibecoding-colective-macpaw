import type { QuestState } from "../../../shared/voice.js";
import type { QuestReplyId } from "./lines.js";

export type SofiaHintStage =
  | "initial"
  | "oleg-known"
  | "guard-hint"
  | "pixel-rejected"
  | "code-revealed"
  | "after-escape";

interface SofiaHintStageData {
  replyId: QuestReplyId;
  contextText: string;
}

export const SOFIA_HINT_STAGES: Record<SofiaHintStage, SofiaHintStageData> = {
  "after-escape": {
    replyId: "sofia-hint-after-escape",
    contextText:
      "Current Sofiia hint stage: the player has already escaped. Reflect on the shared exit and keep it celebratory, not instructional.",
  },
  "code-revealed": {
    replyId: "sofia-hint-code-revealed",
    contextText:
      "Current Sofiia hint stage: the code is already known. Nudge the player to give the code to the person standing between them and the door, without saying this is a mechanic.",
  },
  "pixel-rejected": {
    replyId: "sofia-hint-pixel-rejected",
    contextText:
      "Current Sofiia hint stage: Pixel rejected ordinary human requests. Nudge the player to try Pixel's own language or a cat-like sound, without revealing the code.",
  },
  "guard-hint": {
    replyId: "sofia-hint-guard-clue",
    contextText:
      "Current Sofiia hint stage: Oleg already pointed toward Pixel. Nudge the player only to address Pixel directly and try talking to him calmly. Do not suggest cat language, cat sounds, purring, meowing, or Pixel's own language yet.",
  },
  "oleg-known": {
    replyId: "sofia-hint-oleg-known",
    contextText:
      "Current Sofiia hint stage: the player knows the guard is Oleg. Nudge the player to address Oleg directly about the exit, not to speak to the room in general.",
  },
  initial: {
    replyId: "sofia-hint-initial",
    contextText:
      "Current Sofiia hint stage: the player has not learned the guard's name. Nudge the player to start with a human introduction or ask the person near the door who he is.",
  },
};

export function getSofiaHintStageForState(state: QuestState): SofiaHintStage {
  if (state.doorOpen) return "after-escape";
  if (state.codeRevealed) return "code-revealed";
  if (state.pixelRejectedOrdinaryCommand) return "pixel-rejected";
  if (state.guardHintGiven) return "guard-hint";
  if (state.olegNameKnown) return "oleg-known";

  return "initial";
}

export function getSofiaHintReplyId(state: QuestState): QuestReplyId {
  return SOFIA_HINT_STAGES[getSofiaHintStageForState(state)].replyId;
}

export function getSofiaHintStageContext(state: QuestState): string {
  return SOFIA_HINT_STAGES[getSofiaHintStageForState(state)].contextText;
}
