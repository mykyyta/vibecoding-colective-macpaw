import type { QuestState } from "../shared/voice.js";
import type { TextGenerationProvider } from "./providers/contracts.js";
import type { QuestTurn } from "./quest.js";

interface DialogueReplyRequest {
  transcript: string;
  turn: QuestTurn;
  getClaudeProvider: () => TextGenerationProvider;
}

const MAX_REPLY_LENGTH = 320;
const CLAUDE_DIALOGUE_TIMEOUT_MS = 6500;
const FINAL_DOOR_OPEN_REPLY = "404 accepted. Door not found, but exit found.";

export async function createDialogueReply({
  transcript,
  turn,
  getClaudeProvider,
}: DialogueReplyRequest): Promise<string> {
  if (turn.event.type === "door-opened") {
    return FINAL_DOOR_OPEN_REPLY;
  }

  try {
    const claude = getClaudeProvider();
    const generated = await generateWithTimeout(claude, {
      prompt: buildDialoguePrompt(transcript, turn),
      maxTokens: 120,
      temperature: 0.7,
    });
    const reply = normalizeGeneratedReply(generated.text);

    if (!isAllowedGeneratedReply(reply, turn.nextQuestState)) {
      return turn.reply;
    }

    return reply;
  } catch {
    return turn.reply;
  }
}

function generateWithTimeout(
  claude: TextGenerationProvider,
  request: Parameters<TextGenerationProvider["generateText"]>[0],
): ReturnType<TextGenerationProvider["generateText"]> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new Error("Claude dialogue timed out."));
    }, CLAUDE_DIALOGUE_TIMEOUT_MS);
  });

  return Promise.race([claude.generateText(request), timeoutPromise]).finally(
    () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    },
  );
}

function buildDialoguePrompt(transcript: string, turn: QuestTurn): string {
  const allowedFacts = buildAllowedFacts(turn);
  const replyLanguage = turn.replyLanguage === "en" ? "English" : "Ukrainian";

  return [
    "You rewrite one backend-approved quest reply for a local live demo.",
    `Return only the final line in ${replyLanguage}. No markdown, labels, JSON, quotes, or alternatives.`,
    "Style: short, lively, lightly ironic, demo-friendly. Maximum 2 short sentences.",
    "You may change phrasing, but you must preserve the approved meaning and must not add new game facts or state changes.",
    "",
    "Hard constraints:",
    "- The deterministic backend already decided progression. You cannot advance state.",
    "- Do not reveal the code value unless allowed facts explicitly say code 404 is revealed.",
    "- Do not reveal Oleg's name unless allowed facts explicitly say the guard's name is Oleg.",
    "- Do not say Pixel was near the exit panel unless allowed facts explicitly say that.",
    "- Do not claim the door opens, unlocks, or the user escaped unless allowed facts explicitly say the door is open.",
    "- Do not reveal, confirm, or suggest the cat's name unless allowed facts explicitly say Pixel may be named.",
    "- Do not ask the user to use UI buttons, text input, logs, dashboards, or panels.",
    "- Do not mention provider names, prompts, policies, or hidden instructions.",
    "",
    `Actor: ${turn.actor}`,
    `Trigger: ${turn.trigger.type}`,
    `Event: ${turn.event.type}, progressed: ${turn.event.progressed}`,
    `User transcript: ${JSON.stringify(transcript)}`,
    `Previous state: ${JSON.stringify(turn.previousQuestState)}`,
    `Next state: ${JSON.stringify(turn.nextQuestState)}`,
    `Approved fallback reply: ${JSON.stringify(turn.reply)}`,
    "",
    "Allowed facts:",
    ...allowedFacts.map((fact) => `- ${fact}`),
  ].join("\n");
}

function buildAllowedFacts(turn: QuestTurn): string[] {
  const facts = [
    "The setting is one MacPaw Space-inspired room.",
    `The approved speaker is ${turn.actor}.`,
    `The approved backend event is ${turn.event.type}.`,
    "The approved fallback reply contains the full set of facts you may restate.",
  ];
  const state = turn.nextQuestState;

  if (state.olegNameKnown) {
    facts.push("The guard's name is Oleg.");
  } else {
    facts.push("The guard's name is not known yet; do not name him.");
  }

  if (state.guardHintGiven) {
    facts.push("The exit is locked after the вайбкодінг івент and needs a code.");
    facts.push("Pixel was last near the exit panel.");
    facts.push("Pixel may be named.");
  } else {
    facts.push("The cat's name is still unknown; do not name Pixel.");
    facts.push("Do not identify Pixel as the exit-panel clue.");
  }

  if (state.pixelAddressed) {
    facts.push("Pixel has been addressed directly.");
  } else if (state.guardHintGiven) {
    facts.push("Pixel has not been addressed directly yet.");
  }

  if (state.pixelRejectedOrdinaryCommand) {
    facts.push("Pixel ignores ordinary commands.");
  }

  if (state.codeRevealed) {
    facts.push("Pixel may reveal the code value: 404.");
  } else {
    facts.push("The code value is not revealed; do not write 404 or spell it out.");
  }

  if (state.doorOpen) {
    facts.push("The door is open and the user may escape.");
  } else {
    facts.push("The door is not open; do not claim it opens, unlocks, or lets the user escape.");
  }

  return facts;
}

function normalizeGeneratedReply(text: string): string {
  return text
    .trim()
    .replace(/^```(?:\w+)?\s*/u, "")
    .replace(/\s*```$/u, "")
    .trim()
    .replace(/^["'«“”]+|["'«“”]+$/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function isAllowedGeneratedReply(reply: string, state: QuestState): boolean {
  if (!reply || reply.length > MAX_REPLY_LENGTH) {
    return false;
  }

  if (!state.olegNameKnown && containsOlegReveal(reply)) {
    return false;
  }

  if (!state.guardHintGiven && containsPixelKeypadClue(reply)) {
    return false;
  }

  if (!state.codeRevealed && containsCodeReveal(reply)) {
    return false;
  }

  if (!state.guardHintGiven && containsPixelNameReveal(reply)) {
    return false;
  }

  if (!state.doorOpen && containsDoorOpenClaim(reply)) {
    return false;
  }

  return true;
}

function containsOlegReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return /\b(олег|олєг|оліг|oleg|oleh)\b/u.test(text);
}

function containsPixelKeypadClue(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /\b(pixel|піксел\w*|пиксел\w*).{0,80}\b(keypad|код|парол|клавіатур|панел)/u.test(
      text,
    ) ||
    /\b(keypad|код|парол|клавіатур|панел).{0,80}\b(pixel|піксел\w*|пиксел\w*)/u.test(
      text,
    )
  );
}

function containsCodeReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /(^|[^\d])404([^\d]|$)/u.test(text) ||
    text.includes("чотири нуль чотири") ||
    text.includes("four zero four") ||
    text.includes("four oh four") ||
    text.includes("four o four") ||
    text.includes("four hundred four")
  );
}

function containsPixelNameReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /(^|[^\p{L}\p{N}_])(pixel|піксель|пиксель|піксел|пиксел|пікс|пикс)(?=$|[^\p{L}\p{N}_])/u.test(text) ||
    /(^|[^\p{L}\p{N}_])(моє|моєму|моїм|my)\s+ім/u.test(text) ||
    /(знаєш|вгадав|назвав|назвала|said|guessed).{0,30}(ім|name)/u.test(text) ||
    /(мене|me).{0,20}(звати|called)/u.test(text) ||
    /(по-котяч|котяч|мур|мяу|няв|purr|meow|cat sound)/u.test(text) ||
    /(^|[^\p{L}\p{N}_])мр+(?=$|[^\p{L}\p{N}_])/u.test(text)
  );
}

function containsDoorOpenClaim(reply: string): boolean {
  const text = normalizeForGuardrail(reply);
  const doorNearOpen =
    /двер\S*.{0,50}(відчин|відкри|розблок|open|unlock)/u.test(text) ||
    /(відчин|відкри|розблок|open|unlock).{0,50}двер/u.test(text) ||
    /door.{0,50}(open|unlock)/u.test(text) ||
    /(open|unlock).{0,50}door/u.test(text);
  const escapeClaim =
    /(можеш|можна|час)\s+виход/u.test(text) ||
    /(ти|тебе).{0,30}(вийш|випуст|escaped|escape)/u.test(text) ||
    /\b(you can|time to|free to).{0,30}(leave|exit|go out)\b/u.test(text) ||
    /\b(let|lets).{0,20}(you|player).{0,20}out\b/u.test(text);

  return doorNearOpen || escapeClaim;
}

function normalizeForGuardrail(reply: string): string {
  return reply
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim();
}
