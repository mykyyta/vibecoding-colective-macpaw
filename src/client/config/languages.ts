import type { QuestLanguage } from "../../shared/voice";

export const DEFAULT_QUEST_LANGUAGE: QuestLanguage = "uk";

export const BROWSER_RECOGNITION_LANGUAGE: Record<QuestLanguage, string> = {
  uk: "uk-UA",
  en: "en-US",
};
