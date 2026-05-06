export type VoiceAction =
  | { type: "set-theme"; value: "stage" | "bright" | "focus" }
  | { type: "set-status-visible"; value: boolean }
  | { type: "clear-log" }
  | { type: "none" };

export type QuestActor = "system" | "guard" | "pixel" | "door";

export type QuestTriggerType =
  | "generic-door-command"
  | "ask-guard-name"
  | "oleg-directed-door-command"
  | "oleg-directed-code"
  | "pixel-directed-command"
  | "pixel-directed-purr"
  | "purr-without-pixel"
  | "smalltalk"
  | "unknown";

export interface QuestState {
  olegNameKnown: boolean;
  guardHintGiven: boolean;
  pixelAddressed: boolean;
  pixelRejectedOrdinaryCommand: boolean;
  codeRevealed: boolean;
  doorOpen: boolean;
  escaped: boolean;
}

export interface QuestTrigger {
  type: QuestTriggerType;
  actor: QuestActor;
  directAddress: boolean;
  matched: string[];
}

export type QuestEventType =
  | "no-progress"
  | "oleg-name-learned"
  | "guard-hint-given"
  | "pixel-ordinary-rejected"
  | "code-revealed"
  | "door-opened"
  | "smalltalk-replied";

export interface QuestEvent {
  type: QuestEventType;
  progressed: boolean;
}

export interface VoiceTurnRequest {
  transcript: string;
  questState?: Partial<QuestState>;
}

export interface VoiceTurnResponse {
  transcript: string;
  reply: string;
  action: VoiceAction;
  actor: QuestActor;
  trigger: QuestTrigger;
  event: QuestEvent;
  previousQuestState: QuestState;
  nextQuestState: QuestState;
  audio?: {
    contentType: string;
    base64: string;
    provider: "elevenlabs";
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
}
