import type { QuestEventType } from "../../../shared/voice.js";

export interface SecretFact {
  id: string;
  description: string;
  revealedByMoveId: QuestEventType | null;
  patterns: string[];
  matchType: "substring" | "regex";
}

export const SECRETS: SecretFact[] = [
  {
    id: "hoover-clue",
    description: "Hoover must not be mentioned before dan-door-checked",
    revealedByMoveId: "dan-door-checked",
    patterns: ["(^|[^\\p{L}\\p{N}_])(hoover|хувер|ховер|гувер)(?=$|[^\\p{L}\\p{N}_])"],
    matchType: "regex",
  },
  {
    id: "fixel-badge",
    description: "Fixel and the badge must not be revealed before hoover-clue-given",
    revealedByMoveId: "hoover-clue-given",
    patterns: [
      "(^|[^\\p{L}\\p{N}_])(fixel|фіксель|фіксел|фиксель|фиксел)(?=$|[^\\p{L}\\p{N}_])",
      "(бейдж|бедж|badge)",
    ],
    matchType: "regex",
  },
  {
    id: "code-404",
    description: "Code 404 must not be revealed before code-revealed",
    revealedByMoveId: "code-revealed",
    patterns: ["(^|[^\\d])404([^\\d]|$)"],
    matchType: "regex",
  },
  {
    id: "code-404-words",
    description: "Spoken-out variants of code 404 must not be revealed before code-revealed",
    revealedByMoveId: "code-revealed",
    patterns: [
      "чотири нуль чотири",
      "чотири ноль чотири",
      "чотириста чотири",
      "four zero four",
      "four oh four",
      "four o four",
      "four hundred four",
    ],
    matchType: "substring",
  },
  {
    id: "door-open",
    description: "Claims that the door is open or the player can exit must not appear before door-opened",
    revealedByMoveId: "door-opened",
    patterns: [
      "двер\\S*.{0,50}(відчин|відкри|розблок|open|unlock)",
      "(відчин|відкри|розблок|open|unlock).{0,50}двер",
      "door.{0,50}(open|unlock)",
      "(open|unlock).{0,50}door",
      "(можеш|можна|час)\\s+виход",
      "(ти|тебе).{0,30}(вийш|випуст|escaped|escape)",
      "\\b(you can|time to|free to).{0,30}(leave|exit|go out)\\b",
      "\\b(let|lets).{0,20}(you|player).{0,20}out\\b",
    ],
    matchType: "regex",
  },
];
