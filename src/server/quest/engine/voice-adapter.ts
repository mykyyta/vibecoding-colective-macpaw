import type { QuestActor } from "../../../shared/voice.js";

export type ElevenLabsVoiceRole = "dan" | "hoover" | "sofia";
export type ElevenLabsSpeechActor = Exclude<QuestActor, "fixel">;

export interface ElevenLabsVoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}

const VOICE_ROLE_BY_ACTOR: Record<ElevenLabsSpeechActor, ElevenLabsVoiceRole> = {
  sofia: "sofia",
  dan: "dan",
  hoover: "hoover",
  system: "sofia",
};

const VOICE_SETTINGS_BY_ACTOR: Partial<
  Record<ElevenLabsSpeechActor, ElevenLabsVoiceSettings>
> = {
  hoover: {
    stability: 0.42,
    similarityBoost: 0.78,
    style: 0.28,
    speed: 0.82,
    useSpeakerBoost: true,
  },
};

export function canSynthesizeActorSpeech(
  actor: QuestActor,
): actor is ElevenLabsSpeechActor {
  return actor !== "fixel";
}

export function getElevenLabsVoiceRole(
  actor: ElevenLabsSpeechActor,
): ElevenLabsVoiceRole {
  return VOICE_ROLE_BY_ACTOR[actor];
}

export function getElevenLabsVoiceSettings(
  actor: ElevenLabsSpeechActor,
): ElevenLabsVoiceSettings | undefined {
  return VOICE_SETTINGS_BY_ACTOR[actor];
}
