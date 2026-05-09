import type { QuestActor, QuestLanguage, QuestState } from "../shared/voice.js";
import { VOICE_COPY } from "./voice-copy.js";

export type BubbleActor = "guard" | "pixel" | "sofia" | "room";

export interface BrowserSpeechSettings {
  rate: number;
  pitch: number;
}

interface PersonaDisplay {
  // Bubble actor used by SceneBubbleContent. Some actors share a bubble visual:
  // door renders as guard, system renders as room.
  bubbleActor: BubbleActor;
  // Display name resolver: per-language, optionally state-aware.
  // Guard reveals "Олег" only after olegNameKnown.
  getDisplayName: (state: QuestState, language: QuestLanguage) => string;
  browserSpeech: BrowserSpeechSettings;
}

export const PERSONAS_DISPLAY: Record<QuestActor, PersonaDisplay> = {
  guard: {
    bubbleActor: "guard",
    getDisplayName: (state, language) =>
      state.olegNameKnown
        ? "Олег"
        : VOICE_COPY[language].guardName,
    browserSpeech: { rate: 0.98, pitch: 0.9 },
  },
  pixel: {
    bubbleActor: "pixel",
    getDisplayName: () => "Pixel",
    browserSpeech: { rate: 0.82, pitch: 1.08 },
  },
  sofia: {
    bubbleActor: "sofia",
    getDisplayName: (_state, language) => VOICE_COPY[language].sofiaName,
    browserSpeech: { rate: 0.94, pitch: 1.04 },
  },
  door: {
    bubbleActor: "guard",
    getDisplayName: (_state, language) => VOICE_COPY[language].doorName,
    browserSpeech: { rate: 0.9, pitch: 0.72 },
  },
  system: {
    bubbleActor: "room",
    getDisplayName: (_state, language) => VOICE_COPY[language].roomName,
    browserSpeech: { rate: 0.9, pitch: 0.72 },
  },
};
