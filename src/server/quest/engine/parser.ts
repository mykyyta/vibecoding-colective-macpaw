import type { QuestActor, QuestNameTagActor } from "../../../shared/voice.js";
import type { QuestTransitionId } from "./transitions.js";

export interface ClaudeQuestDecision {
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  nameTagActors: QuestNameTagActor[];
  confidence?: number;
}

const TRANSITION_IDS: QuestTransitionId[] = [
  "chitchat-replied",
  "sofia-introduced",
  "dan-explained-door",
  "dan-badge-asked",
  "hoover-ordinary-rejected",
  "hoover-clue-given",
  "fixel-sleeping-rejected",
  "code-revealed",
  "door-opened",
  "sofia-hint-given",
];

const ACTORS: QuestActor[] = ["system", "sofia", "dan", "hoover", "fixel"];
const NAME_TAG_ACTORS: QuestNameTagActor[] = ["sofia", "dan", "hoover", "fixel"];

export function parseClaudeQuestDecision(text: string): ClaudeQuestDecision {
  const parsed = JSON.parse(stripJsonEnvelope(text)) as unknown;

  if (!isRecord(parsed)) {
    throw new Error("Claude quest decision must be an object.");
  }

  const transitionId = parsed.transitionId;
  const actor = parsed.actor;
  const reply = parsed.reply;
  const nameTagActors = parsed.nameTagActors;
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
    !Array.isArray(nameTagActors) ||
    !nameTagActors.every((value): value is QuestNameTagActor =>
      typeof value === "string" && NAME_TAG_ACTORS.includes(value as QuestNameTagActor),
    )
  ) {
    throw new Error("Claude quest decision has invalid nameTagActors.");
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
    nameTagActors: dedupeNameTagActors(nameTagActors),
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

function dedupeNameTagActors(actors: QuestNameTagActor[]): QuestNameTagActor[] {
  return NAME_TAG_ACTORS.filter((actor) => actors.includes(actor));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
