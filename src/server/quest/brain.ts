import type { QuestActor, QuestLanguage, QuestState } from "../../shared/voice.js";
import type { TextGenerationProvider } from "../providers/contracts.js";
import { FINAL_DOOR_LINE } from "./replies.js";
import { buildQuestBrainPrompt } from "./prompt.js";
import {
  containsCatSoundOrLanguageHint,
  containsCodeReveal,
  containsDoorOpenClaim,
  containsOlegReveal,
  containsPixelKeypadClue,
  containsPixelNameReveal,
  normalizeForGuardrail,
} from "./guardrails.js";
import {
  analyzeQuestTranscript,
  createQuestTurn,
  createQuestTurnFromTransition,
  getAllowedQuestTransitions,
  getChitchatFallbackReply,
  isTransitionLegal,
  normalizeQuestState,
  type AllowedQuestTransition,
  type QuestTranscriptFacts,
  type QuestTransitionId,
  type QuestTurn,
} from "./index.js";

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

const CLAUDE_QUEST_TIMEOUT_MS = 7000;
const MAX_REPLY_LENGTH = 320;
const MAX_SOFIA_REPLY_LENGTH = 220;

const TRANSITION_IDS: QuestTransitionId[] = [
  "chitchat-replied",
  "oleg-name-learned",
  "guard-hint-given",
  "pixel-ordinary-rejected",
  "code-revealed",
  "door-opened",
  "sofia-hint-given",
];

const ACTORS: QuestActor[] = ["system", "guard", "pixel", "door", "sofia"];

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
      console.info("[quest-brain] transition.invalid", {
        transitionId: decision.transitionId,
        actor: decision.actor,
      });
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
      console.info("[quest-brain] transition.illegal", {
        transitionId: decision.transitionId,
      });
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

    if (turn.event.type === "door-opened") {
      return { ...turn, reply: FINAL_DOOR_LINE };
    }

    if (replyPassesGuardrails(turn)) {
      return turn;
    }

    console.info("[quest-brain] reply.guardrail_failed", {
      transitionId: decision.transitionId,
      actor: decision.actor,
    });
    const fallbackReply =
      decision.transitionId === "chitchat-replied"
        ? getChitchatFallbackReply(
            decision.actor,
            normalizedQuestState,
            replyLanguage,
          )
        : allowedTransition.fallbackReply;

    return createQuestTurnFromTransition({
      transcript,
      questState: normalizedQuestState,
      transitionId: decision.transitionId,
      actor: decision.actor,
      reply: fallbackReply,
      replyLanguage,
    });
  } catch (error) {
    console.info("[quest-brain] claude.failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return fallbackTurn;
  }
}

function replyPassesGuardrails(turn: QuestTurn): boolean {
  if (
    requiresOlegNameInReply(turn.event.type) &&
    !containsOlegReveal(turn.reply)
  ) {
    return false;
  }

  if (
    turn.event.type === "guard-hint-given" &&
    !containsPixelNameReveal(turn.reply)
  ) {
    return false;
  }

  if (isPrematureSofiaCatLanguageHint(turn)) {
    return false;
  }

  if (!isAllowedQuestBrainReply(turn)) {
    return false;
  }

  if (
    turn.actor === "sofia" &&
    !isAllowedSofiaReply(turn.reply, turn.event.type)
  ) {
    return false;
  }

  return true;
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
  const allowedActors = allowedTransition.allowedActors ?? [
    allowedTransition.actor,
  ];

  if (!allowedActors.includes(decision.actor)) {
    return false;
  }

  return isTransitionLegal(
    decision.transitionId,
    normalizedQuestState,
    transcriptFacts,
  );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
