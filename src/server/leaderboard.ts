import { createHmac, randomBytes } from "node:crypto";
import type { Request, Response } from "express";

import {
  COMPLETION_TOKEN_NONCE_BYTES,
  DEFAULT_LEADERBOARD_ID,
  DISPLAY_NAME_MAX_LENGTH,
  DISPLAY_NAME_MIN_LENGTH,
  LEADERBOARD_DEFAULT_LIMIT,
  LEADERBOARD_MAX_LIMIT,
  MAX_COMPLETION_ATTEMPTS,
  MAX_COMPLETION_DURATION_MS,
  type CreateLeaderboardEntryRequest,
  type CreateLeaderboardEntryResponse,
  type LeaderboardCompletionMetrics,
  type LeaderboardCompletionTokenPayload,
  type LeaderboardCompletionTokenResponse,
  type LeaderboardDynamoItem,
  type LeaderboardEntry,
  type LeaderboardErrorCode,
  type LeaderboardErrorResponse,
  type LeaderboardId,
  type LeaderboardListResponse,
} from "../shared/leaderboard.js";
import type { QuestState } from "../shared/voice.js";
import { createLeaderboardCreatedKey } from "./leaderboard-storage.js";

const COMPLETION_TOKEN_VERSION = "v1";
const TOKEN_PARTS = 2;
const ALLOWED_CREATE_FIELDS = new Set<keyof CreateLeaderboardEntryRequest>([
  "displayName",
  "completionToken",
]);

export interface LeaderboardConfig {
  enabled: boolean;
  writesEnabled: boolean;
  leaderboardId: LeaderboardId;
  completionTokenSecret?: string;
  maxEntries: number;
}

export interface LeaderboardStore {
  list(limit: number): Promise<LeaderboardEntry[]>;
  create(item: LeaderboardDynamoItem): Promise<LeaderboardEntry>;
}

interface QuestSession {
  sessionId: string;
  startedAt: Date;
  attempts: number;
  completedAt?: Date;
  completionTokenNonce?: string;
}

interface QuestSessionTokenPayload {
  sessionId: string;
  startedAt: string;
  attempts: number;
  completedAt?: string;
  completionTokenNonce?: string;
}

interface CreateEntryResult {
  status: number;
  body:
    | CreateLeaderboardEntryResponse
    | LeaderboardErrorResponse;
}

interface ListEntriesResult {
  status: number;
  body: LeaderboardListResponse | LeaderboardErrorResponse;
}

const sessions = new Map<string, QuestSession>();

export function getLeaderboardConfigFromEnv(env = process.env): LeaderboardConfig {
  const hasLeaderboardStorage =
    Boolean(env.LEADERBOARD_TABLE_NAME) &&
    Boolean(env.LEADERBOARD_COMPLETION_TOKEN_SECRET);
  const explicitlyDisabled = env.LEADERBOARD_ENABLED === "false";
  const writesExplicitlyDisabled = env.LEADERBOARD_WRITE_ENABLED === "false";
  const enabled = !explicitlyDisabled && hasLeaderboardStorage;

  return {
    enabled,
    writesEnabled: enabled && !writesExplicitlyDisabled,
    leaderboardId: env.LEADERBOARD_ID || DEFAULT_LEADERBOARD_ID,
    completionTokenSecret: env.LEADERBOARD_COMPLETION_TOKEN_SECRET,
    maxEntries: parseLimit(env.LEADERBOARD_MAX_ENTRIES, LEADERBOARD_DEFAULT_LIMIT),
  };
}

export function registerQuestSessionTurn(input: {
  sessionId?: string;
  completed: boolean;
  config: LeaderboardConfig;
}): {
  sessionId: string;
  completion?: LeaderboardCompletionTokenResponse;
} {
  const now = new Date();
  const session = getQuestSessionFromInput(
    input.sessionId,
    input.config.completionTokenSecret,
    now,
  );

  session.attempts += 1;

  if (input.completed && session.completedAt === undefined) {
    session.completedAt = now;
    session.completionTokenNonce = randomBytes(COMPLETION_TOKEN_NONCE_BYTES).toString(
      "base64url",
    );
  }

  sessions.set(session.sessionId, session);
  const responseSessionId = input.config.completionTokenSecret
    ? signQuestSessionToken(session, input.config.completionTokenSecret)
    : session.sessionId;

  if (
    session.completedAt === undefined ||
    session.completionTokenNonce === undefined ||
    !input.config.enabled ||
    !input.config.completionTokenSecret
  ) {
    return { sessionId: responseSessionId };
  }

  const metrics = getSessionMetrics(session);
  const payload: LeaderboardCompletionTokenPayload = {
    ...metrics,
    leaderboardId: input.config.leaderboardId,
    sessionId: session.sessionId,
    nonce: session.completionTokenNonce,
  };

  return {
    sessionId: responseSessionId,
    completion: {
      token: signCompletionToken(payload, input.config.completionTokenSecret),
      metrics,
    },
  };
}

export async function handleListLeaderboard(input: {
  request: Request;
  store: LeaderboardStore;
  config: LeaderboardConfig;
}): Promise<ListEntriesResult> {
  if (!input.config.enabled) {
    return errorResult(503, "leaderboard-disabled", "Leaderboard is disabled.");
  }

  const limit = parseLimit(
    typeof input.request.query.limit === "string"
      ? input.request.query.limit
      : undefined,
    input.config.maxEntries,
  );

  try {
    const entries = await input.store.list(Math.min(limit, input.config.maxEntries));

    return {
      status: 200,
      body: {
        leaderboardId: input.config.leaderboardId,
        sort: "newest-first",
        limit,
        entries,
      },
    };
  } catch (error) {
    return storageError(error);
  }
}

export async function handleCreateLeaderboardEntry(input: {
  request: Request;
  store: LeaderboardStore;
  config: LeaderboardConfig;
}): Promise<CreateEntryResult> {
  if (!input.config.enabled) {
    return errorResult(503, "leaderboard-disabled", "Leaderboard is disabled.");
  }

  if (!input.config.writesEnabled) {
    return errorResult(503, "writes-disabled", "Leaderboard writes are disabled.");
  }

  if (!input.config.completionTokenSecret) {
    return errorResult(
      503,
      "storage-not-configured",
      "Leaderboard completion token secret is not configured.",
    );
  }

  const parsed = parseCreateRequest(input.request.body);

  if (!parsed.ok) {
    return errorResult(400, parsed.code, parsed.message);
  }

  const token = verifyCompletionToken(
    parsed.request.completionToken,
    input.config.completionTokenSecret,
  );

  if (!token.ok) {
    return errorResult(401, "invalid-completion-token", token.error);
  }

  if (token.payload.leaderboardId !== input.config.leaderboardId) {
    return errorResult(
      401,
      "invalid-completion-token",
      "Completion token is for a different leaderboard.",
    );
  }

  const entryId = createEntryIdFromToken(token.payload);
  const item: LeaderboardDynamoItem = {
    entryId,
    leaderboardId: token.payload.leaderboardId,
    sessionId: token.payload.sessionId,
    tokenNonce: token.payload.nonce,
    displayName: parsed.request.displayName,
    completedAt: token.payload.completedAt,
    durationMs: token.payload.durationMs,
    attempts: token.payload.attempts,
    submittedAt: new Date().toISOString(),
    createdKey: createLeaderboardCreatedKey({
      completedAt: token.payload.completedAt,
      entryId,
    }),
  };

  try {
    const entry = await input.store.create(item);
    const entries = await input.store.list(input.config.maxEntries);

    return {
      status: 201,
      body: {
        entry,
        leaderboard: {
          leaderboardId: input.config.leaderboardId,
          sort: "newest-first",
          limit: input.config.maxEntries,
          entries,
        },
      },
    };
  } catch (error) {
    if (isConditionalWriteFailure(error)) {
      return errorResult(409, "completion-token-used", "Completion token was already used.");
    }

    return storageError(error);
  }
}

export function isQuestCompleted(questState: QuestState): boolean {
  return questState.doorOpen;
}

export function createMemoryLeaderboardStore(): LeaderboardStore {
  const items = new Map<string, LeaderboardDynamoItem>();

  return {
    async list(limit) {
      return [...items.values()]
        .sort((left, right) => left.createdKey.localeCompare(right.createdKey))
        .slice(0, limit)
        .map(toLeaderboardEntry);
    },
    async create(item) {
      if (items.has(item.createdKey)) {
        throw new ConditionalWriteFailure();
      }

      items.set(item.createdKey, item);

      return toLeaderboardEntry(item);
    },
  };
}

export class ConditionalWriteFailure extends Error {
  constructor() {
    super("Conditional write failed.");
  }
}

function getQuestSessionFromInput(
  sessionTokenOrId: string | undefined,
  secret: string | undefined,
  now: Date,
): QuestSession {
  const trimmed = sessionTokenOrId?.trim();

  if (trimmed && secret) {
    const verifiedSession = verifyQuestSessionToken(trimmed, secret);

    if (verifiedSession) {
      return verifiedSession;
    }
  }

  if (trimmed && !secret) {
    const existingSession = sessions.get(trimmed);

    if (existingSession) {
      return existingSession;
    }
  }

  return {
    sessionId: secret ? randomId() : trimmed || randomId(),
    startedAt: now,
    attempts: 0,
  };
}

function parseCreateRequest(
  body: unknown,
):
  | { ok: true; request: CreateLeaderboardEntryRequest }
  | { ok: false; code: LeaderboardErrorCode; message: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, code: "invalid-request", message: "JSON object body is required." };
  }

  const bodyObject = body as Record<string, unknown>;
  const unknownFields = Object.keys(bodyObject).filter(
    (field) => !ALLOWED_CREATE_FIELDS.has(field as keyof CreateLeaderboardEntryRequest),
  );

  if (unknownFields.length > 0) {
    return {
      ok: false,
      code: "invalid-request",
      message: `Unknown field: ${unknownFields[0]}.`,
    };
  }

  const displayName =
    typeof bodyObject.displayName === "string" ? bodyObject.displayName.trim() : "";

  if (
    displayName.length < DISPLAY_NAME_MIN_LENGTH ||
    displayName.length > DISPLAY_NAME_MAX_LENGTH
  ) {
    return {
      ok: false,
      code: "invalid-display-name",
      message: `Display name must be ${DISPLAY_NAME_MIN_LENGTH}-${DISPLAY_NAME_MAX_LENGTH} characters.`,
    };
  }

  if (typeof bodyObject.completionToken !== "string" || !bodyObject.completionToken) {
    return {
      ok: false,
      code: "missing-completion-token",
      message: "Completion token is required.",
    };
  }

  return {
    ok: true,
    request: {
      displayName,
      completionToken: bodyObject.completionToken,
    },
  };
}

function signCompletionToken(
  payload: LeaderboardCompletionTokenPayload,
  secret: string,
): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${COMPLETION_TOKEN_VERSION}.${encodedPayload}`)
    .digest("base64url");

  return `${COMPLETION_TOKEN_VERSION}.${encodedPayload}.${signature}`;
}

function signQuestSessionToken(session: QuestSession, secret: string): string {
  const payload: QuestSessionTokenPayload = {
    sessionId: session.sessionId,
    startedAt: session.startedAt.toISOString(),
    attempts: session.attempts,
    completedAt: session.completedAt?.toISOString(),
    completionTokenNonce: session.completionTokenNonce,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret)
    .update(`${COMPLETION_TOKEN_VERSION}.${encodedPayload}`)
    .digest("base64url");

  return `${COMPLETION_TOKEN_VERSION}.${encodedPayload}.${signature}`;
}

function verifyQuestSessionToken(token: string, secret: string): QuestSession | null {
  const [version, encodedPayload, signature, extra] = token.split(".");

  if (extra !== undefined || version !== COMPLETION_TOKEN_VERSION || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${version}.${encodedPayload}`)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<QuestSessionTokenPayload>;

    return parseQuestSessionTokenPayload(payload);
  } catch {
    return null;
  }
}

function verifyCompletionToken(
  token: string,
  secret: string,
):
  | { ok: true; payload: LeaderboardCompletionTokenPayload }
  | { ok: false; error: string } {
  const [version, encodedPayload, signature, extra] = token.split(".");

  if (extra !== undefined || version !== COMPLETION_TOKEN_VERSION || !encodedPayload || !signature) {
    return { ok: false, error: "Completion token format is invalid." };
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${version}.${encodedPayload}`)
    .digest("base64url");

  if (signature !== expectedSignature) {
    return { ok: false, error: "Completion token signature is invalid." };
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<LeaderboardCompletionTokenPayload>;

    return validateCompletionTokenPayload(payload);
  } catch {
    return { ok: false, error: "Completion token payload is invalid." };
  }
}

function validateCompletionTokenPayload(
  payload: Partial<LeaderboardCompletionTokenPayload>,
):
  | { ok: true; payload: LeaderboardCompletionTokenPayload }
  | { ok: false; error: string } {
  if (
    typeof payload.leaderboardId !== "string" ||
    typeof payload.sessionId !== "string" ||
    typeof payload.nonce !== "string" ||
    typeof payload.startedAt !== "string" ||
    typeof payload.completedAt !== "string" ||
    typeof payload.durationMs !== "number" ||
    typeof payload.attempts !== "number"
  ) {
    return { ok: false, error: "Completion token payload is missing required fields." };
  }

  if (
    !Number.isInteger(payload.durationMs) ||
    payload.durationMs < 0 ||
    payload.durationMs > MAX_COMPLETION_DURATION_MS ||
    !Number.isInteger(payload.attempts) ||
    payload.attempts < 1 ||
    payload.attempts > MAX_COMPLETION_ATTEMPTS
  ) {
    return { ok: false, error: "Completion token metrics are out of bounds." };
  }

  if (
    Number.isNaN(Date.parse(payload.startedAt)) ||
    Number.isNaN(Date.parse(payload.completedAt))
  ) {
    return { ok: false, error: "Completion token timestamps are invalid." };
  }

  return {
    ok: true,
    payload: payload as LeaderboardCompletionTokenPayload,
  };
}

function parseQuestSessionTokenPayload(
  payload: Partial<QuestSessionTokenPayload>,
): QuestSession | null {
  if (
    typeof payload.sessionId !== "string" ||
    typeof payload.startedAt !== "string" ||
    typeof payload.attempts !== "number" ||
    !Number.isInteger(payload.attempts) ||
    payload.attempts < 0 ||
    payload.attempts > MAX_COMPLETION_ATTEMPTS
  ) {
    return null;
  }

  const startedAtMs = Date.parse(payload.startedAt);

  if (Number.isNaN(startedAtMs)) {
    return null;
  }

  const completedAtMs =
    typeof payload.completedAt === "string" ? Date.parse(payload.completedAt) : undefined;

  if (completedAtMs !== undefined && Number.isNaN(completedAtMs)) {
    return null;
  }

  if (
    payload.completionTokenNonce !== undefined &&
    typeof payload.completionTokenNonce !== "string"
  ) {
    return null;
  }

  return {
    sessionId: payload.sessionId,
    startedAt: new Date(startedAtMs),
    attempts: payload.attempts,
    completedAt: completedAtMs === undefined ? undefined : new Date(completedAtMs),
    completionTokenNonce: payload.completionTokenNonce,
  };
}

function getSessionMetrics(session: QuestSession): LeaderboardCompletionMetrics {
  const completedAt = session.completedAt ?? new Date();
  const durationMs = completedAt.getTime() - session.startedAt.getTime();

  return {
    startedAt: session.startedAt.toISOString(),
    completedAt: completedAt.toISOString(),
    durationMs,
    attempts: session.attempts,
  };
}

function createEntryIdFromToken(payload: LeaderboardCompletionTokenPayload): string {
  return createHmac("sha256", payload.sessionId)
    .update(payload.nonce)
    .digest("base64url")
    .slice(0, 24);
}

function parseLimit(value: string | undefined, fallback: number): number {
  const parsed = value ? Number(value) : fallback;

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, LEADERBOARD_MAX_LIMIT);
}

function randomId(): string {
  return randomBytes(16).toString("base64url");
}

function toLeaderboardEntry(item: LeaderboardDynamoItem): LeaderboardEntry {
  return {
    entryId: item.entryId,
    leaderboardId: item.leaderboardId,
    displayName: item.displayName,
    completedAt: item.completedAt,
    durationMs: item.durationMs,
    attempts: item.attempts,
  };
}

function errorResult(
  status: number,
  code: LeaderboardErrorCode,
  message: string,
): { status: number; body: LeaderboardErrorResponse } {
  return {
    status,
    body: {
      error: {
        code,
        message,
      },
    },
  };
}

function storageError(error: unknown): { status: number; body: LeaderboardErrorResponse } {
  const message = error instanceof Error ? error.message : "Unknown leaderboard storage error.";
  const code: LeaderboardErrorCode =
    message.includes("not configured") || message.includes("Missing")
      ? "storage-not-configured"
      : "storage-error";

  return errorResult(code === "storage-not-configured" ? 503 : 502, code, message);
}

function isConditionalWriteFailure(error: unknown): boolean {
  return (
    error instanceof ConditionalWriteFailure ||
    (error instanceof Error && error.name === "ConditionalCheckFailedException")
  );
}

export function sendLeaderboardResult(
  response: Response,
  result: CreateEntryResult | ListEntriesResult,
) {
  response.status(result.status).json(result.body);
}
