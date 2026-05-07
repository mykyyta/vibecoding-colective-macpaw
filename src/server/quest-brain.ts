import type { QuestActor, QuestLanguage, QuestState } from "../shared/voice.js";
import type { TextGenerationProvider } from "./providers/contracts.js";
import {
  analyzeQuestTranscript,
  createQuestTurn,
  createQuestTurnFromTransition,
  getAllowedQuestTransitions,
  normalizeQuestState,
  type AllowedQuestTransition,
  type QuestTranscriptFacts,
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
  route: QuestRoute;
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  confidence?: number;
}

type QuestRoute =
  | "guard"
  | "pixel"
  | "sofia-hint"
  | "sofia-talk"
  | "door"
  | "smalltalk"
  | "no-progress";

interface QuestPromptTransition {
  id: QuestTransitionId;
  route: QuestRoute;
  actor: QuestActor;
  allowedActors?: QuestActor[];
  stageContext: string;
}

const CLAUDE_QUEST_TIMEOUT_MS = 7000;
const MAX_REPLY_LENGTH = 320;
const MAX_SOFIA_REPLY_LENGTH = 220;
const FINAL_DOOR_OPEN_REPLY = "404 accepted. Door not found, but exit found.";

const TRANSITION_IDS: QuestTransitionId[] = [
  "no-progress",
  "oleg-name-learned",
  "guard-hint-given",
  "pixel-ordinary-rejected",
  "pixel-smalltalk-replied",
  "code-revealed",
  "door-opened",
  "sofia-hint-given",
  "sofia-conversation-replied",
  "smalltalk-replied",
];

const ACTORS: QuestActor[] = ["system", "guard", "pixel", "door", "sofia"];
const ROUTES: QuestRoute[] = [
  "guard",
  "pixel",
  "sofia-hint",
  "sofia-talk",
  "door",
  "smalltalk",
  "no-progress",
];

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
  const allowedTransitions = getAllowedQuestTransitions(
    normalizedQuestState,
    replyLanguage,
  );
  const transcriptFacts = analyzeQuestTranscript(transcript);

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

    if (
      !isValidQuestBrainDecision({
        decision,
        allowedTransition,
        normalizedQuestState,
        transcriptFacts,
      })
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

    if (requiresOlegNameInReply(turn.event.type) && !containsOlegReveal(turn.reply)) {
      return fallbackTurn;
    }

    if (turn.event.type === "guard-hint-given" && !containsPixelNameReveal(turn.reply)) {
      return fallbackTurn;
    }

    if (isPrematureSofiaCatLanguageHint(turn)) {
      return createQuestTurnFromTransition({
        transcript,
        questState: normalizedQuestState,
        transitionId: decision.transitionId,
        actor: decision.actor,
        reply: allowedTransition.fallbackReply,
        replyLanguage,
      });
    }

    if (!isAllowedQuestBrainReply(turn)) {
      return fallbackTurn;
    }

    if (turn.actor === "sofia" && !isAllowedSofiaReply(turn.reply, turn.event.type)) {
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
    "You choose the route, transitionId, actor, and spoken reply from the user transcript and current state.",
    `Write one fresh ${replyLanguageLabel} spoken reply for this exact quest turn.`,
    `Selected reply language: ${replyLanguageLabel}.`,
    replyLanguage === "en"
      ? "Reply in natural English. Keep proper names and the fixed final door line exactly as written."
      : "Reply in natural Ukrainian. Keep proper names and the fixed final door line exactly as written.",
    "Use the selected route, actor, current stage, visible room context, and allowed facts.",
    `Include one small ironic joke or character beat about ${aiPhrase}, the ${eventPhrase}, prompts, or generated decisions when it fits the actor and stage. For Sofia, keep any irony very light and do not use event-satisfaction jokes.`,
    "Keep the joke grounded in this moment, not a reusable catchphrase.",
    "Write vivid, varied replies: dry irony, playful MacPaw Space energy, compact theatrical timing.",
    "Avoid generic assistant wording. Each reply should feel like a character on stage, not a chatbot.",
    "The reply must sound spoken by the selected actor, not narrated about them.",
    pixelSoundGuidance,
    "If actor is system or door, write as the room itself: ambient, architectural, dry, and not human.",
    "If actor is guard, write as Oleg or the guard: human, laconic, slightly bureaucratic.",
    "If actor is sofia, write as Sofia: warm, calm, positive, concise, product-designer energy. She is the Vibe Coding Collective co-founder and event organizer, but not the quest organizer or game master.",
    "For actor sofia, write one short statement. Do not ask questions, do not use a question mark, do not ask or assume how the event felt, and do not make jokes about the event getting stuck in the door. The player cannot sustain a dialogue loop here.",
    "Sofia does not know the exact solution. She believes a way out will be found, offers ideas or reframes, lowers pressure, and trusts the participant. She should not sound like she holds the answer key.",
    "For sofia-hint-given, Sofia must use the Sofia hint stageContext from the allowed transition card. Her hint should point to the current next step, not a generic reassurance line.",
    "For sofia-hint-given, Sofia gives a gentle facilitation idea, not an instruction. She may carry the no-winners attitude, but only after the current-step clue is clear.",
    "For Sofia hints after Oleg points to Pixel but before Pixel rejects an ordinary request, Sofia may only suggest addressing Pixel and talking to him calmly. Do not suggest cat language, purring, meowing, sounds, or Pixel's own language at that stage.",
    "For Sofia hints after Pixel rejects an ordinary request, Sofia may then suggest trying Pixel's own language or a cat-like sound.",
    "For sofia-conversation-replied, Sofia handles every non-hint Sofia route: ordinary conversation, questions about Sofia, door/code comments addressed to Sofia, and VCC/vibe-coding/event questions. She should answer from her character brief and the current visible context.",
    "For sofia-conversation-replied, Sofia may briefly explain Vibe Coding Collective or vibe coding as accessible, social, experimental AI-assisted building if the player asked about that context. Otherwise she should not force VCC exposition.",
    "For sofia-conversation-replied, Sofia must not give a quest-step hint unless the player semantically asks Sofia for a hint, help, advice, an idea, direction, or next step.",
    "Do not lean on the same tech joke families every time: middleware, firewall, deploy, access denied, generic AI assistant wording, or generic prompt jokes.",
    "If you use a tech or AI joke, make it specific to this actor and stage, and avoid making it the whole personality.",
    "",
    "JSON schema:",
    `{"route":"one route from the selected transition card","transitionId":"one allowed transition id","actor":"allowed actor for that transition","reply":"${replyLanguageLabel} player-facing reply, max 2 short sentences","confidence":0.0}`,
    "",
    "Scenario:",
    "- Title: 404 Door Not Found.",
    `- The player is in a single MacPaw Space-inspired room after a literal ${eventPhrase} about ${aiPhrase}, and must exit by voice.`,
    "- Visible room context: black presentation wall, light open floor, warm wooden steps, LED rails, locked exit, guard near the door, a cat nearby.",
    `- Current stage: ${getQuestStageSummary(questState)}`,
    `- Visible characters: ${getVisibleCharacterSummary(questState)}.`,
    "- Sofia is also in the room. She is the Vibe Coding Collective co-founder, product designer, and event organizer. She can be asked for optional help or VCC context, but she is not required to solve the quest.",
    "- The guard's name must be learned before useful guard commands work.",
    "- The guard is named Oleg, but his name may only be revealed by transition oleg-name-learned.",
    "- For transition oleg-name-learned, the guard's spoken reply must explicitly say his name is Oleg/Олег.",
    `- Oleg can explain that the exit is locked after the ${eventPhrase} and Pixel was near the exit panel only on transition guard-hint-given.`,
    "- For transition guard-hint-given, the guard's spoken reply must explicitly include the cat's name Pixel/Піксель because this is the clue the player needs for the next step.",
    "- The cat's internal name is Pixel, but that name is a clue and must not be spoken before transition guard-hint-given.",
    "- Pixel ignores ordinary commands.",
    "- Pixel may also be addressed indirectly as a cat, the cat, кіт, котик, пухнастий, хвостатий, муркотун, or similar cat-like descriptions.",
    "- Cat small talk is always available through pixel-smalltalk-replied when the player addresses the cat. The cat should answer in context in his lazy, smug style without changing quest state.",
    "- If the player addresses the cat and no Pixel progress transition should happen, select pixel-smalltalk-replied rather than no-progress.",
    "- Before guard-hint-given, cat small talk must not reveal or imply the cat's name is Pixel and must not mention the exit panel.",
    "- Before code-revealed, cat small talk must not reveal, hint, or joke around code 404.",
    "- Pixel may reveal code 404 only on transition code-revealed.",
    "- code-revealed requires both conditions in the same user transcript: the player names Pixel/Піксель/Пікс directly, and the player performs a clear cat sound such as мур, мрр, мяу, няв, пур, purr, prr, meow, or similar.",
    "- If the player addresses Pixel but only asks, commands, begs, or asks for the code without a cat sound, choose pixel-ordinary-rejected, not code-revealed.",
    "- If the player makes a cat sound without naming Pixel, do not choose code-revealed.",
    "- If the player addresses Pixel directly or indirectly as the cat but no Pixel progression transition is legal yet, choose no-progress with actor pixel and let Pixel joke in his own style.",
    "- Pixel may answer wrong or premature Pixel-directed turns, but he must not reveal the code, exit-panel clue, or advance quest state unless the selected transition allows it.",
    "- The door may open and the user may escape only on transition door-opened.",
    "- For transition door-opened, the reply must be exactly: 404 accepted. Door not found, but exit found.",
    "- Do not omit Oleg's name from oleg-name-learned replies.",
    "- Do not omit Pixel/Піксель from guard-hint-given replies.",
    "- Sofia has exactly two routes: sofia-hint-given and sofia-conversation-replied.",
    "- For any direct Sofia-addressed turn, decide semantically whether the player is asking Sofia for a quest idea, hint, help, advice, direction, or next step. If yes, select sofia-hint-given.",
    "- Treat soft direct requests such as 'чи є ідеї', 'що думаєш', 'як бути', 'куди далі', 'я застряг', 'what do you think', or 'any ideas' as sofia-hint-given when addressed to Sofia.",
    "- If the player asks for help or a hint without addressing Sofia, do not select any Sofia route.",
    "- Select sofia-conversation-replied for ordinary Sofia conversation, door comments, code comments, and VCC/vibe-coding questions when the player is not asking Sofia for a quest idea or next step.",
    "- On sofia-hint-given, the current-step clue is mandatory. Do not answer with only generic encouragement, calm, experimentation, or collaboration.",
    "- On sofia-conversation-replied, Sofia may decide whether to explain Vibe Coding Collective, simply talk, answer about herself, or respond to the player's comment based on the transcript and brief.",
    "- Sofia replies must be short statements, not questions. Do not ask or speculate about the event, the user's feelings, whether the event was enjoyable, or what the user wants next.",
    "- For sofia-conversation-replied, do not mention the event, VCC, Vibe Coding Collective, or vibe coding unless the player explicitly asked about that context.",
    "- If the player only says a general greeting or asks a name without addressing Sofia, keep that smalltalk with the guard because the guard is the key early character.",
    "",
    "Backend authority:",
    "- Decide semantically who the player is addressing. Do not rely on exact keyword matches when the intent is clear.",
    "- Pick route and transitionId from one allowed transition card. The route must match the selected card.",
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
    "- Do not make Sofia say she built, controls, prepared, designed, or understands the quest.",
    "- Do not make Sofia mention stages, mechanics, state, scripts, hidden logic, or answer keys.",
    "- Do not turn Sofia's ordinary hints into VCC exposition.",
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
    route: getQuestRouteForTransition(transition.id),
    actor: transition.actor,
    allowedActors: transition.allowedActors,
    stageContext: transition.description,
  }));
}

function getReplyLanguageLabel(replyLanguage: QuestLanguage): string {
  return replyLanguage === "en" ? "English" : "Ukrainian";
}

function getQuestStageSummary(state: QuestState): string {
  if (state.doorOpen || state.escaped) {
    return "the player has escaped; only celebratory or ambient follow-up should remain";
  }

  if (state.codeRevealed) {
    return "the code is known; the next useful move is giving code 404 to Oleg";
  }

  if (state.pixelRejectedOrdinaryCommand) {
    return "Pixel rejected ordinary human requests; the next useful move is addressing Pixel with a cat-like sound";
  }

  if (state.guardHintGiven) {
    return "Oleg revealed Pixel as the clue near the exit panel; the next useful move is engaging Pixel";
  }

  if (state.olegNameKnown) {
    return "the guard is known as Oleg; the next useful move is directly asking Oleg about the exit";
  }

  return "the guard's name is not known; the next useful move is learning who the person by the door is";
}

function getVisibleCharacterSummary(state: QuestState): string {
  const visible = [
    "guard near the door",
    "cat nearby",
    "locked door/room",
    "Sofia in the room",
  ];

  if (state.olegNameKnown) {
    visible[0] = "Oleg, the guard near the door";
  }

  if (state.guardHintGiven) {
    visible[1] = "Pixel, the cat near the exit panel";
  }

  return visible.join("; ");
}

function isValidQuestBrainDecision({
  decision,
  allowedTransition,
  normalizedQuestState,
  transcriptFacts,
}: {
  decision: ClaudeQuestDecision;
  allowedTransition: AllowedQuestTransition;
  normalizedQuestState: QuestState;
  transcriptFacts: QuestTranscriptFacts;
}): boolean {
  if (decision.route !== getQuestRouteForTransition(decision.transitionId)) {
    return false;
  }

  const allowedActors = allowedTransition.allowedActors ?? [
    allowedTransition.actor,
  ];

  if (!allowedActors.includes(decision.actor)) {
    return false;
  }

  return satisfiesHardTransitionRequirements(
    decision.transitionId,
    normalizedQuestState,
    transcriptFacts,
  );
}

function satisfiesHardTransitionRequirements(
  transitionId: QuestTransitionId,
  state: QuestState,
  facts: QuestTranscriptFacts,
): boolean {
  switch (transitionId) {
    case "oleg-name-learned":
      return !state.olegNameKnown && facts.hasNameQuestion;
    case "guard-hint-given":
      return (
        state.olegNameKnown &&
        !state.guardHintGiven &&
        facts.hasOleg &&
        (facts.hasDoor || facts.hasCodeIntent)
      );
    case "pixel-ordinary-rejected":
      return state.guardHintGiven && !state.pixelRejectedOrdinaryCommand && facts.hasPixel;
    case "pixel-smalltalk-replied":
      return facts.hasPixel || facts.hasCatAddress;
    case "code-revealed":
      return state.guardHintGiven && !state.codeRevealed && facts.hasPixel && facts.hasPurr;
    case "door-opened":
      return (
        state.olegNameKnown &&
        state.codeRevealed &&
        !state.doorOpen &&
        facts.hasOleg &&
        facts.hasCode404
      );
    case "sofia-hint-given":
      return facts.hasSofiaAddress;
    case "sofia-conversation-replied":
      return facts.hasSofiaAddress || facts.hasVccIntent;
    case "smalltalk-replied":
      return true;
    case "no-progress":
      return !facts.hasPixel && !facts.hasCatAddress;
  }
}

function getQuestRouteForTransition(transitionId: QuestTransitionId): QuestRoute {
  switch (transitionId) {
    case "oleg-name-learned":
    case "guard-hint-given":
      return "guard";
    case "pixel-ordinary-rejected":
    case "pixel-smalltalk-replied":
    case "code-revealed":
      return "pixel";
    case "sofia-hint-given":
      return "sofia-hint";
    case "sofia-conversation-replied":
      return "sofia-talk";
    case "door-opened":
      return "door";
    case "smalltalk-replied":
      return "smalltalk";
    case "no-progress":
      return "no-progress";
  }
}

function parseClaudeQuestDecision(text: string): ClaudeQuestDecision {
  const parsed = JSON.parse(stripJsonEnvelope(text)) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("Claude quest decision must be an object.");
  }

  const transitionId = parsed.transitionId;
  const route = parsed.route;
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

  const normalizedRoute =
    typeof route === "string" && ROUTES.includes(route as QuestRoute)
      ? (route as QuestRoute)
      : getQuestRouteForTransition(transitionId as QuestTransitionId);

  if (
    confidence !== undefined &&
    (typeof confidence !== "number" || confidence < 0 || confidence > 1)
  ) {
    throw new Error("Claude quest decision has invalid confidence.");
  }

  return {
    route: normalizedRoute,
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

function requiresOlegNameInReply(eventType: QuestTransitionId): boolean {
  return eventType === "oleg-name-learned";
}

function isAllowedQuestBrainReply(turn: QuestTurn): boolean {
  const { actor, reply, nextQuestState: state } = turn;

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

  if (
    actor !== "pixel" &&
    !state.guardHintGiven &&
    containsCatSoundOrLanguageHint(reply)
  ) {
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

function isAllowedSofiaReply(
  reply: string,
  _eventType: QuestTransitionId,
): boolean {
  if (reply.length > MAX_SOFIA_REPLY_LENGTH || /[?？]/u.test(reply)) {
    return false;
  }

  const text = normalizeForGuardrail(reply);
  const hasEventRecapJoke =
    /(івент|ивент|event).{0,80}(сподобав|сподобалось|сподобався|заліг|застряг|застрягл|stuck|liked|enjoy)/u.test(
      text,
    ) ||
    /(сподобав|сподобалось|сподобався|заліг|застряг|застрягл|stuck|liked|enjoy).{0,80}(івент|ивент|event)/u.test(
      text,
    ) ||
    text.includes("фінальний вайб");

  if (hasEventRecapJoke) {
    return false;
  }

  return ![
    "як тобі",
    "як вам",
    "як ти",
    "як ви",
    "чи ти",
    "чи ви",
    "що ти хочеш",
    "що ви хочете",
    "what do you",
    "what would you",
    "how are you",
    "how was",
    "how do you",
    "do you want",
    "would you",
    "did you",
  ].some((phrase) => text.includes(phrase));
}

function isPrematureSofiaCatLanguageHint(turn: QuestTurn): boolean {
  return (
    turn.event.type === "sofia-hint-given" &&
    turn.previousQuestState.guardHintGiven &&
    !turn.previousQuestState.pixelRejectedOrdinaryCommand &&
    containsCatSoundOrLanguageHint(turn.reply)
  );
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
    /(мене|me).{0,20}(звати|called)/u.test(text)
  );
}

function containsCatSoundOrLanguageHint(reply: string): boolean {
  const text = normalizeForGuardrail(reply);

  return (
    /(по-котяч|котяч|його мов|її мов|own language|мур|мяу|няв|purr|meow|cat sound)/u.test(text) ||
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
