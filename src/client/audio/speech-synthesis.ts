import type { QuestActor, QuestLanguage } from "../../shared/voice";
import { BROWSER_RECOGNITION_LANGUAGE } from "../config/languages";
import { MAX_REPLY_PLAYBACK_WAIT_MS } from "../config/timing";
import { stopActiveAudio } from "./state";

export function speakWithBrowser(
  text: string,
  actor: QuestActor,
  language: QuestLanguage,
): Promise<void> {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return Promise.resolve();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = BROWSER_RECOGNITION_LANGUAGE[language];
  const settings = getBrowserSpeechSettings(actor);

  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;

  stopActiveAudio();
  window.speechSynthesis.cancel();

  return new Promise((resolve) => {
    const speechTimer = window.setTimeout(resolve, MAX_REPLY_PLAYBACK_WAIT_MS);

    const settle = () => {
      window.clearTimeout(speechTimer);
      resolve();
    };

    utterance.onend = () => {
      settle();
    };
    utterance.onerror = () => {
      settle();
    };
    window.speechSynthesis.speak(utterance);
  });
}

export function getBrowserSpeechSettings(actor: QuestActor): {
  rate: number;
  pitch: number;
} {
  switch (actor) {
    case "hoover":
      return { rate: 0.84, pitch: 1.1 };
    case "fixel":
      return { rate: 0.82, pitch: 1.08 };
    case "system":
      return { rate: 0.9, pitch: 0.72 };
    case "sofia":
      return { rate: 0.9, pitch: 0.92 };
    case "dan":
      return { rate: 0.9, pitch: 0.78 };
  }
}
