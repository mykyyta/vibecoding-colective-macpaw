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
        "Use when no progression transition is legal. This is the normal route",
        "for greetings, comments, jokes, reactions, acknowledgments, vague sounds,",
        "and any non-help remark. If no clear addressee is present, actor must be",
        "Sofiia and the reply should answer the player's actual phrase with a",
        "fresh, warm in-scene comment. Do not give the next puzzle action, do not",
        "ask a follow-up question, and do not copy fallback/canned wording. If a",
        "visible character is clearly addressed, that character may answer without",
        "revealing gated facts.",
        "On Hoover or Fixel stages, if the player seems to be trying something",
        "but the wording does not legally trigger the cat transition, prefer a",
        "fresh Sofiia stage-aware comment over a generic fallback line: she may",
        "notice Hoover being selective or Fixel staying asleep, but she must not",
        "state the exact missing trigger unless the player explicitly asked for",
        "a hint.",
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
      "Use only when the player explicitly asks for a hint, idea, help, advice, direction, next step, or clearly says they are stuck or do not know what to do. Direct Sofiia address is allowed but not required because Sofiia answers unaddressed help by default. This never advances quest state.",
  },
  "dan-explained-door": {
    id: "dan-explained-door",
    describe: () =>
      "Phase 1 of the Dan dialogue. Use when the player directly addresses Dan with door/exit/code/badge/how-to-leave intent and danExplainedDoor is still false. Do NOT use this for a bare Dan name, greeting, how-are-you, event comment, joke, or ordinary social remark. Required content: the door needs a badge with the code; Dan believes he has one on him; he starts looking for it now. Dan does NOT admit losing the badge yet, does NOT mention the white cat or Hoover, and stays confident. Use fresh Dan wording rather than copying canned or example phrases.",
    fallbackLineId: "dan-explained-door",
  },
  "dan-badge-asked": {
    id: "dan-badge-asked",
    describe: () =>
      "Phase 2 of the Dan dialogue. Use ONLY when danExplainedDoor is true AND the player explicitly suggests that Dan lost the badge (\"може, ти його загубив?\", \"maybe you lost it?\", \"missing?\", \"can't find it?\"). Required content: Dan accepts he cannot find the badge; Hoover, a white cat, was near him; Hoover may have seen something. Dan may lightly suggest checking with Hoover, but should use fresh wording and avoid stock tech metaphors unless the player set up that joke. Any other follow-up keeps Dan in stall mode (chitchat-replied with actor=dan, dan-stalling line).",
    fallbackLineId: "dan-badge-asked",
  },
  "hoover-ordinary-rejected": {
    id: "hoover-ordinary-rejected",
    describe: () =>
      "Use after Dan has pointed toward Hoover when the player addresses Hoover or the white cat, but the wording is not affectionate enough. Bare politeness such as 'будь ласка, Хувере' or 'please, Hoover' is not enough. Hoover refuses ordinary commands and reveals no Fixel, badge, or code facts. Use fresh catlike wording instead of copying fallback lines.",
    fallbackLineId: "hoover-ordinary-rejected",
  },
  "hoover-clue-given": {
    id: "hoover-clue-given",
    describe: () =>
      "Use after Dan has pointed toward Hoover when the player addresses Hoover, the white cat, or an affectionate cat name such as 'Хуверчику', 'котик', 'муркотунчик', 'sweet kitty', 'good kitty', or 'fluffy friend'. Do not require a perfect Hoover transcript when the affectionate cat address is clear. Required content: Fixel took the badge and is using it like a pillow. This is the only transition that may reveal Fixel took the badge. Use fresh catlike wording instead of copying fallback lines.",
    fallbackLineId: "hoover-clue-given",
  },
  "fixel-sleeping-rejected": {
    id: "fixel-sleeping-rejected",
    describe: () =>
      "Use after Hoover's clue when the player addresses Fixel but does NOT offer food. Loud wake attempts (\"гей\", \"бу\", \"прокидайся\", \"hey\", \"boo\", \"wake up\") are explicitly ignored here — Fixel stays asleep. Fixel's reply must be a nonverbal purr or sleepy grumble only.",
    fallbackLineId: "fixel-sleeping-rejected",
  },
  "code-revealed": {
    id: "code-revealed",
    describe: () =>
      "Use after Hoover's clue when the player offers food to Fixel — \"ласощі\", \"риба\", \"смачненьке\", \"кошен\", \"треат\", \"fish\", \"treat\", \"snack\", \"food\", or any mention of edible things. Fixel lifts his head, opens his eyes, and the badge that he was sleeping on falls and dangles on its lanyard, exposing code 404. This is the only transition that may reveal code 404, but Fixel's reply must still be a nonverbal waking sound only.",
    fallbackLineId: "code-revealed",
  },
  "door-opened": {
    id: "door-opened",
    describe: () =>
      "Use only after the code has been revealed and the player directly gives code 404 to Dan. Actor must be Dan. The backend will force the exact final line.",
    fallbackLineId: "door-opened",
  },
};
