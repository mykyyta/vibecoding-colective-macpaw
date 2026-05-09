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
    id: "oleg-name",
    description: "The guard's name Oleg must not be revealed before oleg-name-learned",
    revealedByMoveId: "oleg-name-learned",
    patterns: ["\\b(олег|олєг|оліг|oleg|oleh)\\b"],
    matchType: "regex",
  },
  {
    id: "pixel-name",
    description: "Pixel's name must not be revealed before guard-hint-given",
    revealedByMoveId: "guard-hint-given",
    patterns: [
      "(^|[^\\p{L}\\p{N}_])(pixel|піксель|пиксель|піксел|пиксел|пікс|пикс)(?=$|[^\\p{L}\\p{N}_])",
      "(^|[^\\p{L}\\p{N}_])(моє|моєму|моїм|my)\\s+ім",
      "(знаєш|вгадав|назвав|назвала|said|guessed).{0,30}(ім|name)",
      "(мене|me).{0,20}(звати|called)",
    ],
    matchType: "regex",
  },
  {
    id: "pixel-keypad-clue",
    description: "Pixel near the panel clue must not be revealed before guard-hint-given",
    revealedByMoveId: "guard-hint-given",
    patterns: [
      "\\b(pixel|піксел\\w*|пиксел\\w*).{0,80}\\b(keypad|код|парол|клавіатур|панел)",
      "\\b(keypad|код|парол|клавіатур|панел).{0,80}\\b(pixel|піксел\\w*|пиксел\\w*)",
    ],
    matchType: "regex",
  },
  {
    id: "cat-language",
    description: "Cat-sound or cat-language hints must not be given before pixel-ordinary-rejected (stage-conditional: checked only in specific actor/state combos)",
    revealedByMoveId: "pixel-ordinary-rejected",
    patterns: [
      "(по-котяч|котяч|його мов|її мов|own language|мур|мяу|няв|purr|meow|cat sound)",
      "(^|[^\\p{L}\\p{N}_])мр+(?=$|[^\\p{L}\\p{N}_])",
    ],
    matchType: "regex",
  },
  {
    id: "code-404",
    description: "Code 404 must not be revealed before code-revealed",
    revealedByMoveId: "code-revealed",
    patterns: [
      "(^|[^\\d])404([^\\d]|$)",
    ],
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
