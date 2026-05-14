import type { QuestState } from "../../../shared/voice.js";
import type { QuestReplyId } from "./lines.js";

export type SofiaHintStage =
  | "initial"
  | "dan-explained"
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
      "Current Sofiia hint stage: Hoover revealed that Fixel took the badge. Fixel is sleeping with his head on the badge and will not wake to noise — he reacts only when addressed with any food or edible mention (ласощі, риба, корм, віскас, цукерочка, treat, cat food, candy). Nudge the player to think about food, without saying the code or directly spelling out the trick.",
  },
  "dan-asked": {
    replyId: "sofia-hint-after-dan",
    contextText:
      "Current Sofiia hint stage: Dan revealed the white cat was around him the whole time. Nudge the player to address that cat calmly and without pressure. Do not mention Fixel, the badge's current location, or the code.",
  },
  "dan-explained": {
    replyId: "sofia-hint-after-explained",
    contextText:
      "Current Sofiia hint stage: Dan claims he has the badge on him and keeps stalling — \"give me a second, almost got it\". He is NOT admitting it's lost yet. The player must explicitly suggest to Dan that he may have lost the badge to break him out of the stall. Sofiia's hint should be direct and should include a concrete example question the player can say, such as \"Дене, може, ти загубив бейдж?\" or \"Dan, maybe you lost the badge?\" Do not yet mention Hoover, Fixel, or the cat by name.",
  },
  initial: {
    replyId: "sofia-hint-initial",
    contextText:
      "Current Sofiia hint stage: the player has not yet asked Dan about the door or the badge. Nudge the player to start with Dan.",
  },
};

export function getSofiaHintStageForState(state: QuestState): SofiaHintStage {
  if (state.doorOpen) return "after-escape";
  if (state.codeRevealed) return "code-revealed";
  if (state.hooverClueGiven) return "hoover-clue";
  if (state.danBadgeAsked) return "dan-asked";
  if (state.danExplainedDoor) return "dan-explained";

  return "initial";
}

export function getSofiaHintReplyId(state: QuestState): QuestReplyId {
  return SOFIA_HINT_STAGES[getSofiaHintStageForState(state)].replyId;
}

export function getSofiaHintStageContext(state: QuestState): string {
  return SOFIA_HINT_STAGES[getSofiaHintStageForState(state)].contextText;
}
