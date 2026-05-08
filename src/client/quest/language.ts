import {
  mapProviderLanguageCodeToQuestLanguage,
} from "../../shared/voice";
import type {
  QuestLanguageDecision,
  QuestLanguageInput,
} from "../../shared/voice";

export function isReliableLanguageDecision(decision: QuestLanguageDecision): boolean {
  return !decision.ambiguous && decision.source !== "default";
}

export function createLanguageInput({
  source,
  providerLanguageCode,
  confidence,
}: {
  source: QuestLanguageInput["source"];
  providerLanguageCode?: string;
  confidence?: number;
}): QuestLanguageInput | undefined {
  const cleanProviderLanguageCode = providerLanguageCode?.trim();
  const cleanConfidence =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? Math.max(0, Math.min(1, confidence))
      : undefined;

  if (!source && !cleanProviderLanguageCode && cleanConfidence === undefined) {
    return undefined;
  }

  return {
    language: cleanProviderLanguageCode
      ? mapProviderLanguageCodeToQuestLanguage(cleanProviderLanguageCode)
      : undefined,
    confidence: cleanConfidence,
    providerLanguageCode: cleanProviderLanguageCode || undefined,
    source,
  };
}
