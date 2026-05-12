import type { LeaderboardCompletionTokenResponse } from "./leaderboard.js";

export type VoiceAction =
  | { type: "set-theme"; value: "stage" | "bright" | "focus" }
  | { type: "set-status-visible"; value: boolean }
  | { type: "clear-log" }
  | { type: "none" };

export type QuestActor = "system" | "sofia" | "dan" | "hoover" | "fixel";
export type QuestNameTagActor = Exclude<QuestActor, "system">;

export type QuestLanguage = "uk" | "en";

export type QuestLanguageSource =
  | "elevenlabs"
  | "browser-speech"
  | "heuristic"
  | "sticky"
  | "default";

export interface QuestLanguageInput {
  language?: QuestLanguage;
  confidence?: number;
  providerLanguageCode?: string;
  source?: QuestLanguageSource;
}

export interface QuestLanguageDecision {
  language: QuestLanguage;
  source: QuestLanguageSource;
  confidence?: number;
  providerLanguageCode?: string;
  ambiguous: boolean;
}

export function mapProviderLanguageCodeToQuestLanguage(
  providerLanguageCode: string,
): QuestLanguage | undefined {
  const normalized = providerLanguageCode.trim().toLowerCase().replace("_", "-");

  if (normalized === "uk" || normalized === "ukr" || normalized.startsWith("uk-")) {
    return "uk";
  }

  if (normalized === "en" || normalized === "eng" || normalized.startsWith("en-")) {
    return "en";
  }

  return undefined;
}

export interface QuestState {
  sofiaIntroduced: boolean;
  danExplainedDoor: boolean;
  danBadgeAsked: boolean;
  hooverClueGiven: boolean;
  codeRevealed: boolean;
  doorOpen: boolean;
}

export type QuestEventType =
  | "chitchat-replied"
  | "sofia-introduced"
  | "dan-explained-door"
  | "dan-badge-asked"
  | "hoover-ordinary-rejected"
  | "hoover-clue-given"
  | "fixel-sleeping-rejected"
  | "code-revealed"
  | "door-opened"
  | "sofia-hint-given";

export interface QuestEvent {
  type: QuestEventType;
  progressed: boolean;
}

export interface VoiceTurnRequest {
  transcript: string;
  questState?: Partial<QuestState>;
  questSessionId?: string;
  language?: QuestLanguageInput;
  previousLanguage?: QuestLanguage;
}

export interface VoiceTurnResponse {
  transcript: string;
  languageDecision: QuestLanguageDecision;
  reply: string;
  nameTagActors: QuestNameTagActor[];
  action: VoiceAction;
  actor: QuestActor;
  event: QuestEvent;
  previousQuestState: QuestState;
  nextQuestState: QuestState;
  questSessionId?: string;
  leaderboardCompletion?: LeaderboardCompletionTokenResponse;
  audio?: {
    contentType: string;
    base64: string;
    provider: "elevenlabs";
  };
  soundEffect?: {
    assetUrl: string;
    fallbackText: string;
    id: "fixel-purr-soft" | "fixel-grumble" | "fixel-wake-mrrp";
    provider: "asset";
  };
  audioError?: string;
}

export interface RealtimeSttCapabilityResponse {
  provider: "elevenlabs";
  realtimeAvailable: boolean;
  modelId: string;
  reason?: string;
}

export interface RealtimeSttSessionResponse {
  provider: "elevenlabs";
  token: string;
  websocketUrl: string;
  modelId: string;
  expiresInSeconds: number;
}

export interface RecordedSttResponse {
  provider: "elevenlabs";
  text: string;
  language?: QuestLanguageInput;
}
