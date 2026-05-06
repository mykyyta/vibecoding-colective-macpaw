import type {
  TextToSpeechProvider,
  TextToSpeechRequest,
  TextToSpeechResponse,
} from "./contracts.js";
import type {
  ElevenLabsProviderConfig,
  ElevenLabsRealtimeSttConfig,
} from "./config.js";
import { throwProviderHttpError } from "./http.js";

const MAX_TTS_TEXT_LENGTH = 1_000;
const ELEVENLABS_REALTIME_STT_URL =
  "wss://api.elevenlabs.io/v1/speech-to-text/realtime";
const SINGLE_USE_TOKEN_EXPIRES_IN_SECONDS = 15 * 60;

export interface ElevenLabsRealtimeSttSession {
  provider: "elevenlabs";
  token: string;
  websocketUrl: string;
  modelId: string;
  expiresInSeconds: number;
}

export interface ElevenLabsTranscription {
  provider: "elevenlabs";
  modelId: string;
  text: string;
}

export function createElevenLabsTextToSpeechProvider(
  config: ElevenLabsProviderConfig,
): TextToSpeechProvider {
  return {
    provider: "elevenlabs",
    model: config.ttsModel,
    defaultVoiceId: config.defaultVoiceId,
    voiceIds: config.voiceIds,
    async synthesizeSpeech(
      request: TextToSpeechRequest,
    ): Promise<TextToSpeechResponse> {
      const text = request.text.trim();

      if (!text) {
        throw new Error("ElevenLabs text-to-speech requires non-empty text.");
      }

      if (text.length > MAX_TTS_TEXT_LENGTH) {
        throw new Error(
          `ElevenLabs text-to-speech text is too long. Limit: ${MAX_TTS_TEXT_LENGTH} characters.`,
        );
      }

      const voiceId = request.voiceId?.trim() || config.defaultVoiceId;
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "xi-api-key": config.apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: config.ttsModel,
            voice_settings: request.voiceSettings
              ? {
                  stability: request.voiceSettings.stability,
                  similarity_boost: request.voiceSettings.similarityBoost,
                  style: request.voiceSettings.style,
                  speed: request.voiceSettings.speed,
                  use_speaker_boost: request.voiceSettings.useSpeakerBoost,
                }
              : undefined,
          }),
        },
      );

      if (!response.ok) {
        await throwProviderHttpError("ElevenLabs", response);
      }

      return {
        provider: "elevenlabs",
        model: config.ttsModel,
        voiceId,
        audio: await response.arrayBuffer(),
        contentType: response.headers.get("content-type") ?? "audio/mpeg",
      };
    },
  };
}

export async function createElevenLabsRealtimeSttSession(
  config: ElevenLabsRealtimeSttConfig,
): Promise<ElevenLabsRealtimeSttSession> {
  const response = await fetch(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    {
      method: "POST",
      headers: {
        "xi-api-key": config.apiKey,
      },
    },
  );

  if (!response.ok) {
    await throwProviderHttpError("ElevenLabs", response);
  }

  const body = (await response.json()) as { token?: unknown };

  if (typeof body.token !== "string" || !body.token.trim()) {
    throw new Error("ElevenLabs realtime STT token response did not include a token.");
  }

  const token = body.token.trim();
  const query = new URLSearchParams({
    model_id: config.model,
    token,
    language_code: "uk",
    audio_format: "pcm_16000",
    commit_strategy: "vad",
    vad_silence_threshold_secs: "1.3",
    vad_threshold: "0.4",
    min_speech_duration_ms: "100",
    min_silence_duration_ms: "120",
    no_verbatim: "false",
  });

  return {
    provider: "elevenlabs",
    token,
    websocketUrl: `${ELEVENLABS_REALTIME_STT_URL}?${query.toString()}`,
    modelId: config.model,
    expiresInSeconds: SINGLE_USE_TOKEN_EXPIRES_IN_SECONDS,
  };
}

export async function transcribeElevenLabsAudio({
  config,
  audio,
  contentType,
}: {
  config: ElevenLabsRealtimeSttConfig;
  audio: Uint8Array;
  contentType: string;
}): Promise<ElevenLabsTranscription> {
  if (audio.byteLength === 0) {
    throw new Error("ElevenLabs speech-to-text requires non-empty audio.");
  }

  const modelId = getFileSttModelId(config.model);
  const formData = new FormData();
  const audioBytes = new Uint8Array(audio);
  const file = new Blob([audioBytes], {
    type: contentType || "audio/webm",
  });

  formData.append("file", file, getAudioFileName(contentType));
  formData.append("model_id", modelId);
  formData.append("language_code", "uk");
  formData.append("tag_audio_events", "false");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": config.apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    await throwProviderHttpError("ElevenLabs", response);
  }

  const body = (await response.json()) as { text?: unknown };
  const text = typeof body.text === "string" ? body.text.trim() : "";

  return {
    provider: "elevenlabs",
    modelId,
    text,
  };
}

function getFileSttModelId(configuredModel: string): string {
  return configuredModel.endsWith("_realtime")
    ? configuredModel.slice(0, -"_realtime".length)
    : configuredModel;
}

function getAudioFileName(contentType: string): string {
  if (contentType.includes("mp4")) {
    return "speech.mp4";
  }

  if (contentType.includes("mpeg") || contentType.includes("mp3")) {
    return "speech.mp3";
  }

  if (contentType.includes("wav")) {
    return "speech.wav";
  }

  return "speech.webm";
}
