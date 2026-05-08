import type { QuestLanguage } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";

export function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatRelativeTime(
  isoDate: string,
  language: QuestLanguage,
): string {
  const copy = VOICE_COPY[language];
  const elapsedSeconds = Math.max(
    0,
    Math.round((Date.now() - Date.parse(isoDate)) / 1000),
  );

  if (elapsedSeconds < 45) {
    return copy.relativeJustNow;
  }

  const elapsedMinutes = Math.round(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return copy.relativeMinuteAgo(elapsedMinutes);
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return copy.relativeHourAgo(elapsedHours);
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "uk-UA", {
    day: "2-digit",
    month: "short",
  }).format(new Date(isoDate));
}
