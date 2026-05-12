import type { QuestEventType, QuestLanguage, QuestState } from "../../../shared/voice.js";
import type { QuestReplyId } from "./lines.js";

export interface MoveScenarioData {
  id: QuestEventType;
  describe: (state: QuestState, lang: QuestLanguage) => string;
  fallbackLineId?: QuestReplyId;
}

export const MOVE_SCENARIO_DATA: Record<QuestEventType, MoveScenarioData> = {
  "chitchat-replied": {
    id: "chitchat-replied",
    describe: () =>
      [
        "Use when no progression transition is legal. If no clear addressee is",
        "present, actor must be Sofiia and the reply should be short general",
        "context. If a visible character is clearly addressed, that character",
        "may answer without revealing gated facts.",
      ].join(" "),
  },
  "sofia-introduced": {
    id: "sofia-introduced",
    describe: () =>
      [
        "Use on the player's very first turn of the session, regardless of what",
        "the player said or whom they addressed. Sofiia takes the floor: she",
        "introduces herself, introduces Dan, mentions that the door is locked",
        "and they need the player's help, and that the badge with the code was",
        "at Dan but he misplaced it. The reply may include a soft nudge to ask",
        "Dan. Actor must be Sofiia. nameTagActors must include sofia and dan.",
      ].join(" "),
    fallbackLineId: "sofia-introduced",
  },
  "sofia-hint-given": {
    id: "sofia-hint-given",
    describe: () =>
      "Use only when the player directly addresses Sofiia and asks for a hint, idea, help, advice, direction, or next step. This never advances quest state.",
  },
  "dan-badge-asked": {
    id: "dan-badge-asked",
    describe: () =>
      "Use when the player directly addresses Dan and asks about the badge, the lost badge, the code, where to find it, or how to leave/exit. Dan briefly acknowledges the badge and mentions Hoover (the white cat by the door) was around when he last had it, then slips back to vibe-coding chatter. Dan must not raise the badge or door topics himself in any other transition.",
    fallbackLineId: "dan-badge-asked",
  },
  "hoover-ordinary-rejected": {
    id: "hoover-ordinary-rejected",
    describe: () =>
      "Use after Dan has pointed toward Hoover when the player addresses Hoover directly, but the wording is not gentle enough. Hoover refuses ordinary commands and reveals no Fixel, badge, or code facts.",
    fallbackLineId: "hoover-ordinary-rejected",
  },
  "hoover-clue-given": {
    id: "hoover-clue-given",
    describe: () =>
      "Use after Dan has pointed toward Hoover when the player addresses Hoover directly and gently. This is the only transition that may reveal Fixel took the badge.",
    fallbackLineId: "hoover-clue-given",
  },
  "fixel-sleeping-rejected": {
    id: "fixel-sleeping-rejected",
    describe: () =>
      "Use after Hoover's clue when the player addresses Fixel but does not plausibly try to wake him. Fixel remains asleep, the code is not revealed, and Fixel's reply must be a nonverbal purr or sleepy grumble only.",
    fallbackLineId: "fixel-sleeping-rejected",
  },
  "code-revealed": {
    id: "code-revealed",
    describe: () =>
      "Use after Hoover's clue when the player addresses Fixel and makes a plausible waking attempt such as wake up, hey, boo, гей, бу, прокидайся, or similar. This is the only transition that may reveal code 404, but Fixel's reply must still be a nonverbal waking sound only.",
    fallbackLineId: "code-revealed",
  },
  "door-opened": {
    id: "door-opened",
    describe: () =>
      "Use only after the code has been revealed and the player directly gives code 404 to Dan. Actor must be Dan. The backend will force the exact final line.",
    fallbackLineId: "door-opened",
  },
};
