import type { QuestActor } from "../../shared/voice.js";
import type { QuestTransitionId } from "./engine/transitions.js";

export interface ClaudeQuestDecision {
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  confidence?: number;
}

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

export function parseClaudeQuestDecision(text: string): ClaudeQuestDecision {
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
    .replace(/^["'«""]+|["'«""]+$/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
