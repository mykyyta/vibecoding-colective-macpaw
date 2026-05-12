import type {
  QuestLanguage,
  QuestNameTagActor,
  QuestState,
} from "../../../shared/voice.js";
import type {
  TextGenerationProvider,
  TextGenerationUsage,
} from "../../providers/contracts.js";
import { getFinalDoorLine, getQuestReply } from "../scenario/lines.js";
import { buildQuestBrainPromptContent } from "./prompt.js";
import { replyPassesGuardrails } from "./guardrails.js";
import { parseClaudeQuestDecision, type ClaudeQuestDecision } from "./parser.js";
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
  type QuestTurn,
} from "../index.js";

interface QuestBrainRequest {
  transcript: string;
  questState: Partial<QuestState>;
  replyLanguage?: QuestLanguage;
  getClaudeProvider: () => TextGenerationProvider;
}

interface BrainContext {
  transcript: string;
  state: QuestState;
  facts: QuestTranscriptFacts;
  language: QuestLanguage;
  allowedTransitions: AllowedQuestTransition[];
  fallbackTurn: QuestTurn;
  getClaudeProvider: () => TextGenerationProvider;
}

type ValidationResult =
  | { ok: true; allowedTransition: AllowedQuestTransition }
  | { ok: false; reason: "transition.invalid" | "transition.illegal" };

const CLAUDE_QUEST_TIMEOUT_MS = 7000;

export async function createQuestBrainTurn(req: QuestBrainRequest): Promise<QuestTurn> {
  const ctx = prepareBrainContext(req);

  let decision: ClaudeQuestDecision | null;
  try {
    decision = await tryGetClaudeDecision(ctx);
  } catch (error) {
    logBrainTelemetry("claude.failed", { error: errorMessage(error) });
    return ctx.fallbackTurn;
  }

  if (!decision) return ctx.fallbackTurn;

  const validation = validateDecision(decision, ctx);
  if (!validation.ok) {
    logBrainTelemetry(validation.reason, {
      transitionId: decision.transitionId,
      actor: decision.actor,
    });
    return ctx.fallbackTurn;
  }

  return finalizeAcceptedDecision(decision, ctx);
}

function prepareBrainContext(req: QuestBrainRequest): BrainContext {
  const state = normalizeQuestState(req.questState);
  const language = req.replyLanguage ?? "uk";
  const facts = analyzeQuestTranscript(req.transcript);
  const allowedTransitions = getAllowedQuestTransitions(state, language);
  const fallbackTurn = createQuestTurn(req.transcript, state, language);

  return {
    transcript: req.transcript,
    state,
    facts,
    language,
    allowedTransitions,
    fallbackTurn,
    getClaudeProvider: req.getClaudeProvider,
  };
}

async function tryGetClaudeDecision(
  ctx: BrainContext,
): Promise<ClaudeQuestDecision | null> {
  const claude = ctx.getClaudeProvider();
  const generated = await generateWithTimeout(claude, {
    contentBlocks: buildQuestBrainPromptContent({
      transcript: ctx.transcript,
      questState: ctx.state,
      allowedTransitions: ctx.allowedTransitions,
      replyLanguage: ctx.language,
    }),
    maxTokens: 220,
    temperature: 0.68,
  });
  logClaudeCacheUsage(generated.usage);

  return parseClaudeQuestDecision(generated.text);
}

function validateDecision(
  decision: ClaudeQuestDecision,
  ctx: BrainContext,
): ValidationResult {
  const allowedTransition = ctx.allowedTransitions.find(
    (t) => t.id === decision.transitionId,
  );
  const allowedActors = allowedTransition?.allowedActors ?? [
    allowedTransition?.actor,
  ];

  if (!allowedTransition || !allowedActors.includes(decision.actor)) {
    return { ok: false, reason: "transition.invalid" };
  }

  if (!isTransitionLegal(decision.transitionId, ctx.state, ctx.facts)) {
    return { ok: false, reason: "transition.illegal" };
  }

  return { ok: true, allowedTransition };
}

function finalizeAcceptedDecision(
  decision: ClaudeQuestDecision,
  ctx: BrainContext,
): QuestTurn {
  const turn = createQuestTurnFromTransition({
    transcript: ctx.transcript,
    questState: ctx.state,
    transitionId: decision.transitionId,
    actor: decision.actor,
    reply: decision.reply,
    nameTagActors: filterNameTagActors(decision.nameTagActors, ctx.state, decision.transitionId),
    replyLanguage: ctx.language,
  });

  if (turn.event.type === "door-opened") {
    return { ...turn, reply: getFinalDoorLine(ctx.language) };
  }

  if (turn.actor === "fixel") {
    return {
      ...turn,
      reply: getQuestReply(getFixelNonverbalReplyId(turn.event.type), ctx.language),
    };
  }

  if (replyPassesGuardrails(turn)) {
    return turn;
  }

  logBrainTelemetry("reply.guardrail_failed", {
    transitionId: decision.transitionId,
    actor: decision.actor,
  });

  const allowedTransition = ctx.allowedTransitions.find(
    (t) => t.id === decision.transitionId,
  )!;

  const fallbackReply =
    decision.transitionId === "chitchat-replied"
      ? getChitchatFallbackReply(decision.actor, ctx.state, ctx.language)
      : allowedTransition.fallbackReply;

  return createQuestTurnFromTransition({
    transcript: ctx.transcript,
    questState: ctx.state,
    transitionId: decision.transitionId,
    actor: decision.actor,
    reply: fallbackReply,
    nameTagActors: filterNameTagActors(decision.nameTagActors, ctx.state, decision.transitionId),
    replyLanguage: ctx.language,
  });
}

function filterNameTagActors(
  actors: QuestNameTagActor[],
  state: QuestState,
  transitionId: QuestTurn["event"]["type"],
): QuestNameTagActor[] {
  const nextState =
    transitionId === "sofia-introduced"
      ? { ...state, sofiaIntroduced: true }
      : transitionId === "dan-explained-door"
        ? { ...state, danExplainedDoor: true }
        : transitionId === "dan-badge-asked"
          ? { ...state, danBadgeAsked: true }
          : transitionId === "hoover-clue-given"
            ? { ...state, hooverClueGiven: true }
            : state;

  return actors.filter((actor) => {
    if (actor === "sofia" || actor === "dan") {
      return nextState.sofiaIntroduced;
    }

    if (actor === "hoover") {
      return nextState.danBadgeAsked;
    }

    if (actor === "fixel") {
      return nextState.hooverClueGiven;
    }

    return true;
  });
}

function getFixelNonverbalReplyId(
  eventType: QuestTurn["event"]["type"],
): "code-revealed" | "fixel-sleeping-rejected" | "smalltalk-fixel" {
  if (eventType === "code-revealed") {
    return "code-revealed";
  }

  if (eventType === "fixel-sleeping-rejected") {
    return "fixel-sleeping-rejected";
  }

  return "smalltalk-fixel";
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

function logBrainTelemetry(name: string, fields: Record<string, unknown>): void {
  console.info(`[quest-brain] ${name}`, fields);
}

function logClaudeCacheUsage(usage: TextGenerationUsage | undefined): void {
  if (
    usage?.cacheCreationInputTokens === undefined &&
    usage?.cacheReadInputTokens === undefined
  ) {
    return;
  }

  logBrainTelemetry("claude.cache_usage", {
    cacheCreationInputTokens: usage.cacheCreationInputTokens ?? 0,
    cacheReadInputTokens: usage.cacheReadInputTokens ?? 0,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
