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
        "Use for any player turn that should not progress the quest:",
        "greetings, thanks, jokes, ordinary conversation with any character,",
        "questions about a character, comments about the room or door,",
        "questions about Vibe Coding Collective / vibe coding / the event,",
        "or ambiguous and unintelligible input.",
        "Pick the actor who is being addressed; if no clear address, pick the",
        "most relevant visible character (guard early, Pixel once engaged,",
        "door after escape, sofia for VCC and Sofiia-directed comments).",
        "Sofiia may answer here from her persona including a brief VCC",
        "explanation if asked, but she must not give a quest-step hint:",
        "if the player asks Sofiia for help, choose sofia-hint-given instead.",
      ].join(" "),
  },
  "sofia-hint-given": {
    id: "sofia-hint-given",
    describe: () => "",
  },
  "oleg-name-learned": {
    id: "oleg-name-learned",
    describe: () =>
      "The player asks the guard's name or who he is. This is the only transition that may reveal the guard is Oleg. The spoken reply must explicitly include the name Oleg/Олег because name-based address is the core puzzle key.",
    fallbackLineId: "guard-name",
  },
  "guard-hint-given": {
    id: "guard-hint-given",
    describe: (_state, lang) => {
      const eventPhrase =
        lang === "en" ? "vibecoding event" : "вайбкодінг івент";

      return `The player directly addresses Oleg and asks him to open/unlock the door or help with the exit/code. The spoken reply must explicitly include the cat's name Pixel/Піксель because this is the key clue for the next step. This may reveal that the exit is locked after the ${eventPhrase} and Pixel's exit-panel clue, but not the code.`;
    },
    fallbackLineId: "guard-hint",
  },
  "pixel-ordinary-rejected": {
    id: "pixel-ordinary-rejected",
    describe: () =>
      "The player directly addresses Pixel by name with an ordinary command, request, or question, including asking for the code without making a cat sound. Pixel acknowledges the address but refuses ordinary commands.",
    fallbackLineId: "pixel-ordinary-rejected",
  },
  "code-revealed": {
    id: "code-revealed",
    describe: () =>
      "Use only when the player directly says Pixel's name or a clear Pixel alias and also performs a gentle cat sound in the same transcript, such as mur, mrr, meow, purr, pur, prr, nya/няв/мяу, or similar. Do not use for ordinary commands like asking Pixel for the code without a cat sound. This is the only transition that may reveal code 404.",
    fallbackLineId: "code-revealed",
  },
  "door-opened": {
    id: "door-opened",
    describe: () =>
      "The player directly addresses Oleg and gives the already revealed code 404. This is the only transition that may open the door or mark escape. The reply should use this exact final line: 404 accepted. Door not found, but exit found.",
    fallbackLineId: "door-opened",
  },
};
