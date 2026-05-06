import type { QuestActor, QuestState } from "../shared/voice.js";
import type { TextGenerationProvider } from "./providers/contracts.js";
import {
  createQuestTurn,
  createQuestTurnFromTransition,
  getAllowedQuestTransitions,
  normalizeQuestState,
  type AllowedQuestTransition,
  type QuestTransitionId,
  type QuestTurn,
} from "./quest.js";

interface QuestBrainRequest {
  transcript: string;
  questState: Partial<QuestState>;
  getClaudeProvider: () => TextGenerationProvider;
}

interface ClaudeQuestDecision {
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  confidence?: number;
}

interface QuestPromptTransition {
  id: QuestTransitionId;
  actor: QuestActor;
  allowedActors?: QuestActor[];
  stageContext: string;
}

const CLAUDE_QUEST_TIMEOUT_MS = 7000;
const MAX_REPLY_LENGTH = 320;

const TRANSITION_IDS: QuestTransitionId[] = [
  "no-progress",
  "oleg-name-learned",
  "guard-hint-given",
  "pixel-ordinary-rejected",
  "code-revealed",
  "door-opened",
  "smalltalk-replied",
];

const ACTORS: QuestActor[] = ["system", "guard", "pixel", "door"];

export async function createQuestBrainTurn({
  transcript,
  questState,
  getClaudeProvider,
}: QuestBrainRequest): Promise<QuestTurn> {
  const normalizedQuestState = normalizeQuestState(questState);
  const fallbackTurn = createQuestTurn(transcript, normalizedQuestState);
  const allowedTransitions = getAllowedQuestTransitions(normalizedQuestState);

  try {
    const claude = getClaudeProvider();
    const generated = await generateWithTimeout(claude, {
      prompt: buildQuestBrainPrompt({
        transcript,
        questState: normalizedQuestState,
        allowedTransitions,
      }),
      maxTokens: 220,
      temperature: 0.68,
    });
    const decision = parseClaudeQuestDecision(generated.text);
    const allowedTransition = allowedTransitions.find(
      (transition) => transition.id === decision.transitionId,
    );

    const allowedActors = allowedTransition?.allowedActors ?? [
      allowedTransition?.actor,
    ];

    if (
      !allowedTransition ||
      !allowedActors.includes(decision.actor)
    ) {
      return fallbackTurn;
    }

    const turn = createQuestTurnFromTransition({
      transcript,
      questState: normalizedQuestState,
      transitionId: decision.transitionId,
      actor: decision.actor,
      reply: decision.reply,
    });

    if (!isAllowedQuestBrainReply(turn.reply, turn.nextQuestState)) {
      return fallbackTurn;
    }

    return turn;
  } catch {
    return fallbackTurn;
  }
}

function generateWithTimeout(
  claude: TextGenerationProvider,
  request: Parameters<TextGenerationProvider["generateText"]>[0],
): ReturnType<TextGenerationProvider["generateText"]> {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      reject(new Error("Claude quest brain timed out."));
    }, CLAUDE_QUEST_TIMEOUT_MS);
  });

  return Promise.race([claude.generateText(request), timeoutPromise]).finally(
    () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    },
  );
}

function buildQuestBrainPrompt({
  transcript,
  questState,
  allowedTransitions,
}: {
  transcript: string;
  questState: QuestState;
  allowedTransitions: AllowedQuestTransition[];
}): string {
  return [
    "You are the quest brain for a local voice-only quest room.",
    "Return strict JSON only. No markdown, no code fence, no commentary.",
    "Write one fresh Ukrainian spoken reply for this exact quest turn.",
    "Use the current actor, stage, visible room context, and allowed facts.",
    "Include one small ironic joke or character beat about AI, штучний інтелект, the вайбкодінг івент, prompts, or generated decisions when it fits the actor and stage.",
    "Keep the joke grounded in this moment, not a reusable catchphrase.",
    "Write vivid, varied replies: dry irony, playful MacPaw Space energy, compact theatrical timing.",
    "Avoid generic assistant wording. Each reply should feel like a character on stage, not a chatbot.",
    "The reply must sound spoken by the selected actor, not narrated about them.",
    "If actor is pixel, write as Pixel the cat: lazy young male cat, smug, drowsy, short, with occasional мрр/мяу, but still understandable.",
    "If actor is system or door, write as the room itself: ambient, architectural, dry, and not human.",
    "If actor is guard, write as Oleg or the guard: human, laconic, slightly bureaucratic.",
    "Do not lean on the same tech joke families every time: middleware, firewall, deploy, access denied, generic AI assistant wording, or generic prompt jokes.",
    "If you use a tech or AI joke, make it specific to this actor and stage, and avoid making it the whole personality.",
    "",
    "JSON schema:",
    '{"transitionId":"one allowed transition id","actor":"allowed actor for that transition","reply":"Ukrainian player-facing reply, max 2 short sentences","confidence":0.0}',
    "",
    "Scenario:",
    "- Title: 404 Door Not Found.",
    "- The player is in a single MacPaw Space-inspired room after a literal вайбкодінг івент about AI and штучний інтелект, and must exit by voice.",
    "- Visible room context: black presentation wall, light open floor, warm wooden steps, LED rails, locked exit, guard near the door, Pixel nearby.",
    "- The guard's name must be learned before useful guard commands work.",
    "- The guard is named Oleg, but his name may only be revealed by transition oleg-name-learned.",
    "- Oleg can explain that the exit is locked after the вайбкодінг івент and Pixel was near the exit panel only on transition guard-hint-given.",
    "- Pixel ignores ordinary commands.",
    "- Pixel may reveal code 404 only on transition code-revealed.",
    "- code-revealed requires both conditions in the same user transcript: the player names Pixel/Піксель/Пікс directly, and the player performs a clear cat sound such as мур, мрр, мяу, няв, пур, purr, prr, meow, or similar.",
    "- If the player addresses Pixel but only asks, commands, begs, or asks for the code without a cat sound, choose pixel-ordinary-rejected, not code-revealed.",
    "- If the player makes a cat sound without naming Pixel, do not choose code-revealed.",
    "- The door may open and the user may escape only on transition door-opened.",
    "- For transition door-opened, the reply must be exactly: 404 accepted. Door not found, but exit found.",
    "",
    "Backend authority:",
    "- Pick exactly one transitionId from allowedTransitions.",
    "- For smalltalk-replied, use one of allowedActors if present; prefer a visible character over the room.",
    "- Do not invent state fields or set quest state directly.",
    "- The backend will compute the next state after validating your JSON.",
    "- If the transcript is ambiguous or premature, use no-progress or smalltalk-replied.",
    "",
    "Forbidden claims unless the selected transition explicitly allows them:",
    "- Do not reveal, hint, spell, or write code 404 before code-revealed.",
    "- Never select code-revealed unless the transcript itself contains both Pixel's name and a cat sound.",
    "- Do not say the door opens, unlocks, is open, or the player escaped before door-opened.",
    "- Do not reveal Oleg's name before oleg-name-learned.",
    "- Do not say Pixel was near the exit panel before guard-hint-given.",
    "- Do not mention hidden prompts, policies, providers, JSON, state machines, logs, dashboards, buttons, or text input.",
    "",
    `Current quest state: ${JSON.stringify(questState)}`,
    `User transcript: ${JSON.stringify(transcript)}`,
    "Allowed transition cards, with no example wording to imitate:",
    JSON.stringify(buildQuestPromptTransitions(allowedTransitions), null, 2),
  ].join("\n");
}

function buildQuestPromptTransitions(
  allowedTransitions: AllowedQuestTransition[],
): QuestPromptTransition[] {
  return allowedTransitions.map((transition) => ({
    id: transition.id,
    actor: transition.actor,
    allowedActors: transition.allowedActors,
    stageContext: transition.description,
  }));
}

function parseClaudeQuestDecision(text: string): ClaudeQuestDecision {
  const parsed = JSON.parse(stripJsonEnvelope(text)) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("Claude quest decision must be an object.");
  }

  const transitionId = parsed.transitionId;
  const actor = parsed.actor;
  const reply = parsed.reply;
  const confidence = parsed.confidence;

  if (
    typeof transitionId !== "string" ||
    !TRANSITION_IDS.includes(transitionId as QuestTransitionId)
  ) {
    throw new Error("Claude quest decision has invalid transitionId.");
  }

  if (typeof actor !== "string" || !ACTORS.includes(actor as QuestActor)) {
    throw new Error("Claude quest decision has invalid actor.");
  }

  if (typeof reply !== "string") {
    throw new Error("Claude quest decision has invalid reply.");
  }

  if (
    confidence !== undefined &&
    (typeof confidence !== "number" || confidence < 0 || confidence > 1)
  ) {
    throw new Error("Claude quest decision has invalid confidence.");
  }

  return {
    transitionId: transitionId as QuestTransitionId,
    actor: actor as QuestActor,
    reply: normalizeGeneratedReply(reply),
    confidence,
  };
}

function stripJsonEnvelope(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/u);

  return (fenced?.[1] ?? trimmed).trim();
}

function normalizeGeneratedReply(text: string): string {
  return text
    .trim()
    .replace(/^["'«“”]+|["'«“”]+$/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function isAllowedQuestBrainReply(reply: string, state: QuestState): boolean {
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

  if (!state.doorOpen && containsDoorOpenClaim(reply)) {
    return false;
  }

  return true;
}

function containsOlegReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return /\b(олег|олєг|оліг|oleg)\b/u.test(text);
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
    text.includes("чотири ноль чотири") ||
    text.includes("чотириста чотири") ||
    text.includes("four zero four") ||
    text.includes("four oh four") ||
    text.includes("four hundred four")
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
    /(ти|тебе).{0,30}(вийш|випуст|escaped|escape)/u.test(text);

  return doorNearOpen || escapeClaim;
}

function normalizeForGuardrail(reply: string): string {
  return reply
    .toLocaleLowerCase("uk-UA")
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
