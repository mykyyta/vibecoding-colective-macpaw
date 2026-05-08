import type { QuestLanguage } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";

export async function readApiError(response: Response): Promise<string> {
  const body = await response.text();

  if (!body) {
    return `Request failed with ${response.status}.`;
  }

  try {
    const parsed = JSON.parse(body) as {
      error?: string | { message?: unknown };
    };

    if (typeof parsed.error === "string") {
      return parsed.error;
    }

    if (typeof parsed.error?.message === "string") {
      return parsed.error.message;
    }

    return body;
  } catch {
    return body;
  }
}

export async function readResponseError(response: Response): Promise<string> {
  const body = await response.text();

  if (!body) {
    return "";
  }

  try {
    const parsed = JSON.parse(body) as { error?: unknown };

    return typeof parsed.error === "string" ? parsed.error : body;
  } catch {
    return body;
  }
}

export function getFriendlyLeaderboardError(
  error: unknown,
  language: QuestLanguage,
): string {
  const message = error instanceof Error ? error.message : String(error);
  const copy = VOICE_COPY[language];

  if (message.includes("disabled")) {
    return copy.leaderboardErrorOffline;
  }

  if (message.includes("token")) {
    return copy.leaderboardErrorFinishAgain;
  }

  if (message.includes("Display name")) {
    return copy.leaderboardErrorDisplayName;
  }

  if (message.includes("configured")) {
    return copy.leaderboardErrorNotConfigured;
  }

  return copy.leaderboardErrorUnavailable;
}
