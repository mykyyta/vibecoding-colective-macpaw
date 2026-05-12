import type { QuestState } from "../../../shared/voice.js";
import type { QuestReplyId } from "./lines.js";

export type SofiaHintStage =
  | "initial"
  | "dan-asked"
  | "hoover-clue"
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
      "Current Sofiia hint stage: the door is open. Keep the reply celebratory and organizer-like.",
  },
  "code-revealed": {
    replyId: "sofia-hint-code-revealed",
    contextText:
      "Current Sofiia hint stage: the code is visible. Nudge the player to tell Dan, because Dan works with the door panel.",
  },
  "hoover-clue": {
    replyId: "sofia-hint-after-hoover",
    contextText:
      "Current Sofiia hint stage: Hoover revealed that Fixel took the badge. Nudge the player to look at Fixel and wake him, without saying the code.",
  },
  "dan-asked": {
    replyId: "sofia-hint-after-dan",
    contextText:
      "Current Sofiia hint stage: the player asked Dan about the badge and Dan pointed toward the white cat. Nudge the player to address that cat calmly and without pressure. Do not mention Fixel, the badge's current location, or the code.",
  },
  initial: {
    replyId: "sofia-hint-initial",
    contextText:
      "Current Sofiia hint stage: the player has not yet asked Dan about the badge. Nudge the player to start with Dan — Sofiia already framed that the badge was at Dan and he misplaced it.",
  },
};

export function getSofiaHintStageForState(state: QuestState): SofiaHintStage {
  if (state.doorOpen) return "after-escape";
  if (state.codeRevealed) return "code-revealed";
  if (state.hooverClueGiven) return "hoover-clue";
  if (state.danBadgeAsked) return "dan-asked";

  return "initial";
}

export function getSofiaHintReplyId(state: QuestState): QuestReplyId {
  return SOFIA_HINT_STAGES[getSofiaHintStageForState(state)].replyId;
}

export function getSofiaHintStageContext(state: QuestState): string {
  return SOFIA_HINT_STAGES[getSofiaHintStageForState(state)].contextText;
}
