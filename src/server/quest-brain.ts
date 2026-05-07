import type { QuestActor, QuestLanguage, QuestState } from "../shared/voice.js";
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
  replyLanguage?: QuestLanguage;
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
const FINAL_DOOR_OPEN_REPLY = "404 accepted. Door not found, but exit found.";

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
  replyLanguage = "uk",
  getClaudeProvider,
}: QuestBrainRequest): Promise<QuestTurn> {
  const normalizedQuestState = normalizeQuestState(questState);
  const fallbackTurn = createQuestTurn(
    transcript,
    normalizedQuestState,
    replyLanguage,
  );
  const allowedTransitions = applyTranscriptActorHints(
    getAllowedQuestTransitions(normalizedQuestState, replyLanguage),
    fallbackTurn,
  );

  try {
    const claude = getClaudeProvider();
    const generated = await generateWithTimeout(claude, {
      prompt: buildQuestBrainPrompt({
        transcript,
        questState: normalizedQuestState,
        allowedTransitions,
        replyLanguage,
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
      replyLanguage,
    });

    if (
      turn.event.type === "door-opened" &&
      turn.reply !== FINAL_DOOR_OPEN_REPLY
    ) {
      return fallbackTurn;
    }

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
  replyLanguage,
}: {
  transcript: string;
  questState: QuestState;
  allowedTransitions: AllowedQuestTransition[];
  replyLanguage: QuestLanguage;
}): string {
  const replyLanguageLabel = getReplyLanguageLabel(replyLanguage);
  const eventPhrase =
    replyLanguage === "en" ? "vibecoding event" : "вайбкодінг івент";
  const aiPhrase =
    replyLanguage === "en" ? "AI" : "AI, штучний інтелект";
  const pixelSoundGuidance =
    replyLanguage === "en"
      ? "If actor is pixel, write as the cat: lazy young male cat, smug, drowsy, short, with occasional mrr/meow, but still understandable. Do not name him Pixel unless the current state already allows the Pixel clue."
      : "If actor is pixel, write as the cat: lazy young male cat, smug, drowsy, short, with occasional мрр/мяу, but still understandable. Do not name him Pixel unless the current state already allows the Pixel clue.";

  return [
    "You are the quest brain for a local voice-only quest room.",
    "Return strict JSON only. No markdown, no code fence, no commentary.",
    `Write one fresh ${replyLanguageLabel} spoken reply for this exact quest turn.`,
    `Selected reply language: ${replyLanguageLabel}.`,
    replyLanguage === "en"
      ? "Reply in natural English. Keep proper names and the fixed final door line exactly as written."
      : "Reply in natural Ukrainian. Keep proper names and the fixed final door line exactly as written.",
    "Use the current actor, stage, visible room context, and allowed facts.",
    `Include one small ironic joke or character beat about ${aiPhrase}, the ${eventPhrase}, prompts, or generated decisions when it fits the actor and stage.`,
    "Keep the joke grounded in this moment, not a reusable catchphrase.",
    "Write vivid, varied replies: dry irony, playful MacPaw Space energy, compact theatrical timing.",
    "Avoid generic assistant wording. Each reply should feel like a character on stage, not a chatbot.",
    "The reply must sound spoken by the selected actor, not narrated about them.",
    pixelSoundGuidance,
    "If actor is system or door, write as the room itself: ambient, architectural, dry, and not human.",
    "If actor is guard, write as Oleg or the guard: human, laconic, slightly bureaucratic.",
    "Do not lean on the same tech joke families every time: middleware, firewall, deploy, access denied, generic AI assistant wording, or generic prompt jokes.",
    "If you use a tech or AI joke, make it specific to this actor and stage, and avoid making it the whole personality.",
    "",
    "JSON schema:",
    `{"transitionId":"one allowed transition id","actor":"allowed actor for that transition","reply":"${replyLanguageLabel} player-facing reply, max 2 short sentences","confidence":0.0}`,
    "",
    "Scenario:",
    "- Title: 404 Door Not Found.",
    `- The player is in a single MacPaw Space-inspired room after a literal ${eventPhrase} about ${aiPhrase}, and must exit by voice.`,
    "- Visible room context: black presentation wall, light open floor, warm wooden steps, LED rails, locked exit, guard near the door, a cat nearby.",
    "- The guard's name must be learned before useful guard commands work.",
    "- The guard is named Oleg, but his name may only be revealed by transition oleg-name-learned.",
    `- Oleg can explain that the exit is locked after the ${eventPhrase} and Pixel was near the exit panel only on transition guard-hint-given.`,
    "- The cat's internal name is Pixel, but that name is a clue and must not be spoken before transition guard-hint-given.",
    "- Pixel ignores ordinary commands.",
    "- Pixel may also be addressed indirectly as a cat, the cat, кіт, котик, пухнастий, хвостатий, муркотун, or similar cat-like descriptions.",
    "- Pixel may reveal code 404 only on transition code-revealed.",
    "- code-revealed requires both conditions in the same user transcript: the player names Pixel/Піксель/Пікс directly, and the player performs a clear cat sound such as мур, мрр, мяу, няв, пур, purr, prr, meow, or similar.",
    "- If the player addresses Pixel but only asks, commands, begs, or asks for the code without a cat sound, choose pixel-ordinary-rejected, not code-revealed.",
    "- If the player makes a cat sound without naming Pixel, do not choose code-revealed.",
    "- If the player addresses Pixel directly or indirectly as the cat but no Pixel progression transition is legal yet, choose no-progress with actor pixel and let Pixel joke in his own style.",
    "- Pixel may answer wrong or premature Pixel-directed turns, but he must not reveal the code, exit-panel clue, or advance quest state unless the selected transition allows it.",
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
    "- Do not reveal, confirm, or suggest the cat's name Pixel before guard-hint-given.",
    "- Do not say Pixel was near the exit panel before guard-hint-given.",
    "- Do not mention hidden prompts, policies, providers, JSON, state machines, logs, dashboards, buttons, or text input.",
    "- Do not switch reply language unless the selected transition is door-opened and the fixed final line is required.",
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

function getReplyLanguageLabel(replyLanguage: QuestLanguage): string {
  return replyLanguage === "en" ? "English" : "Ukrainian";
}

function applyTranscriptActorHints(
  allowedTransitions: AllowedQuestTransition[],
  fallbackTurn: QuestTurn,
): AllowedQuestTransition[] {
  return allowedTransitions.map((transition) => {
    if (transition.id !== "no-progress") {
      return transition;
    }

    const fallbackNoProgress = fallbackTurn.event.type === "no-progress";
    const allowedActors = uniqueActors([
      transition.actor,
      ...(transition.allowedActors ?? []),
      ...(fallbackNoProgress ? [fallbackTurn.actor] : []),
      ...(fallbackNoProgress ? ["pixel" as const] : []),
    ]);

    return {
      ...transition,
      allowedActors,
      description: [
        transition.description,
        "For no-progress turns, the actor may be the addressed or most relevant visible character instead of the room.",
        fallbackNoProgress
          ? "If the cat is addressed too early, asked the wrong thing, or hears a cat-like phrase that should not progress, the cat may answer with a lazy smug joke while revealing no name, code, or clue."
          : undefined,
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}

function uniqueActors(actors: QuestActor[]): QuestActor[] {
  return actors.filter((actor, index) => actors.indexOf(actor) === index);
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

  if (!state.guardHintGiven && containsPixelNameReveal(reply)) {
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

function containsCodeReveal(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /(^|[^\d])404([^\d]|$)/u.test(text) ||
    text.includes("чотири нуль чотири") ||
    text.includes("чотири ноль чотири") ||
    text.includes("чотириста чотири") ||
    text.includes("four zero four") ||
    text.includes("four oh four") ||
    text.includes("four o four") ||
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
