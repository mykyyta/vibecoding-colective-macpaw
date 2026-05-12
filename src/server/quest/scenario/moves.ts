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
        "greets, introduces herself and Dan, says the event was great today",
        "and they now need the player's help with the door, and closes with",
        "warm confidence that they will figure something out together. Keep",
        "the intro short and warm — do NOT mention the badge, the code, or",
        "anything specific about how to get out, and do NOT explicitly tell",
        "the player to start with Dan. Let the player decide whom to engage",
        "next. Actor must be Sofiia. nameTagActors must include sofia and dan.",
      ].join(" "),
    fallbackLineId: "sofia-introduced",
  },
  "sofia-hint-given": {
    id: "sofia-hint-given",
    describe: () =>
      "Use only when the player directly addresses Sofiia and asks for a hint, idea, help, advice, direction, or next step. This never advances quest state.",
  },
  "dan-explained-door": {
    id: "dan-explained-door",
    describe: () =>
      "Phase 1 of the Dan dialogue. Use when the player directly addresses Dan with door/exit/code/badge intent and danExplainedDoor is still false. Dan says the door needs a badge with the code, that he has one on him, and that he is reaching for it now (\"зараз, секунду\"). Dan does NOT admit losing the badge yet, does NOT mention the white cat or Hoover, and stays confident.",
    fallbackLineId: "dan-explained-door",
  },
  "dan-badge-asked": {
    id: "dan-badge-asked",
    describe: () =>
      "Phase 2 of the Dan dialogue. Use ONLY when danExplainedDoor is true AND the player explicitly suggests that Dan lost the badge (\"може, ти його загубив?\", \"maybe you lost it?\", \"missing?\", \"can't find it?\"). Only on that explicit loss-suggestion does Dan admit he can't find it — and casually adds that a white cat called Hoover was hanging around him, suggesting the player ask the cat. Any other follow-up keeps Dan in stall mode (chitchat-replied with actor=dan, dan-stalling line).",
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
