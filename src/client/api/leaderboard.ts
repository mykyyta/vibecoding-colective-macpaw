import type {
  CreateLeaderboardEntryResponse,
  LeaderboardListResponse,
} from "../../shared/leaderboard";
import { readApiError } from "./errors";

export async function requestLeaderboard(): Promise<LeaderboardListResponse> {
  const response = await fetch("/api/leaderboard?limit=10");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as LeaderboardListResponse;
}

export async function requestCreateLeaderboardEntry(
  body: {
    displayName: string;
    completionToken: string;
  },
): Promise<CreateLeaderboardEntryResponse> {
  const response = await fetch("/api/leaderboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as CreateLeaderboardEntryResponse;
}
