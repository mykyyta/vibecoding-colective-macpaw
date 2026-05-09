import type { QuestActor } from "../../../shared/voice.js";

export type ElevenLabsVoiceRole = "guard" | "pixel" | "room" | "sofia";

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}

const VOICE_ROLE_BY_ACTOR: Record<QuestActor, ElevenLabsVoiceRole> = {
  guard: "guard",
  pixel: "pixel",
  sofia: "sofia",
  door: "room",
  system: "room",
};

const VOICE_SETTINGS_BY_ACTOR: Partial<Record<QuestActor, ElevenLabsVoiceSettings>> = {
  pixel: {
    stability: 0.42,
    similarityBoost: 0.78,
    style: 0.28,
    speed: 0.82,
    useSpeakerBoost: true,
  },
};

export function getElevenLabsVoiceRole(actor: QuestActor): ElevenLabsVoiceRole {
  return VOICE_ROLE_BY_ACTOR[actor];
}

export function getElevenLabsVoiceSettings(
  actor: QuestActor,
): ElevenLabsVoiceSettings | undefined {
  return VOICE_SETTINGS_BY_ACTOR[actor];
}
