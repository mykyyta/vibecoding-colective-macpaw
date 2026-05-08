import type {
  QuestLanguage,
  QuestLanguageInput,
  QuestState,
  RealtimeSttCapabilityResponse,
  RealtimeSttSessionResponse,
  RecordedSttResponse,
  VoiceTurnResponse,
} from "../../shared/voice";
import { readResponseError } from "./errors";

export async function requestVoiceTurn(
  transcript: string,
  questState: QuestState,
  questSessionId: string | null,
  language?: QuestLanguageInput,
  previousLanguage?: QuestLanguage | null,
): Promise<VoiceTurnResponse> {
  const response = await fetch("/api/voice-turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transcript,
      questState,
      questSessionId: questSessionId ?? undefined,
      language,
      previousLanguage: previousLanguage ?? undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voice turn failed with ${response.status}.`);
  }

  return (await response.json()) as VoiceTurnResponse;
}

export async function requestRealtimeSttCapability(): Promise<RealtimeSttCapabilityResponse> {
  const response = await fetch("/api/stt/capability");

  if (!response.ok) {
    throw new Error(`Realtime STT capability failed with ${response.status}.`);
  }

  return (await response.json()) as RealtimeSttCapabilityResponse;
}

export async function requestRealtimeSttSession(): Promise<RealtimeSttSessionResponse> {
  const response = await fetch("/api/stt/elevenlabs/session", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Realtime STT session failed with ${response.status}.`);
  }

  return (await response.json()) as RealtimeSttSessionResponse;
}

export async function requestRecordedStt(audio: Blob): Promise<RecordedSttResponse> {
  const response = await fetch("/api/stt/elevenlabs/recorded", {
    method: "POST",
    headers: {
      "Content-Type": audio.type || "audio/webm",
    },
    body: audio,
  });

  if (!response.ok) {
    const errorText = await readResponseError(response);

    throw new Error(
      `Recorded STT failed with ${response.status}${errorText ? `: ${errorText}` : ""}.`,
    );
  }

  return (await response.json()) as RecordedSttResponse;
}
