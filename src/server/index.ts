import "dotenv/config";

import express from "express";
import type { AppStatus } from "../shared/status.js";
import type {
  QuestState,
  QuestActor,
  RealtimeSttCapabilityResponse,
  RealtimeSttSessionResponse,
  RecordedSttResponse,
  VoiceTurnRequest,
  VoiceTurnResponse,
} from "../shared/voice.js";
import {
  getElevenLabsRealtimeSttConfig,
  isElevenLabsRealtimeSttConfigured,
  ProviderConfigurationError,
} from "./providers/config.js";
import { createProviderRegistry } from "./providers/registry.js";
import { createQuestBrainTurn } from "./quest-brain.js";
import { normalizeQuestState } from "./quest.js";
import {
  createElevenLabsRealtimeSttSession,
  transcribeElevenLabsAudio,
} from "./providers/elevenlabs.js";

const app = express();
const port = Number(process.env.SERVER_PORT || process.env.PORT || 8787);
const providerRegistry = createProviderRegistry();
const MAX_TRANSCRIPT_LENGTH = 600;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;

app.use(express.json());
app.use("/api/stt/elevenlabs/recorded", express.raw({
  limit: MAX_AUDIO_BYTES,
  type: ["audio/*", "video/webm", "application/octet-stream"],
}));

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/status", (_request, response) => {
  const providers = providerRegistry.getReadiness();
  const providerConfigured = (provider: "claude" | "gemini" | "elevenlabs") =>
    providers.find((status) => status.provider === provider)?.configured ??
    false;
  const status: AppStatus = {
    app: "Vibecoding Collective",
    mode: "live-demo",
    serverTime: new Date().toISOString(),
    environment: {
      claudeApiKeyConfigured: providerConfigured("claude"),
      geminiApiKeyConfigured: providerConfigured("gemini"),
      elevenLabsApiKeyConfigured: isElevenLabsRealtimeSttConfigured(),
      elevenLabsMcpServerUrlConfigured: Boolean(
        process.env.ELEVENLABS_MCP_SERVER_URL,
      ),
      port,
    },
    providers,
  };

  response.json(status);
});

app.get("/api/stt/capability", (_request, response) => {
  const config = getElevenLabsRealtimeSttConfigIfAvailable();
  const payload: RealtimeSttCapabilityResponse = {
    provider: "elevenlabs",
    realtimeAvailable: config !== undefined,
    modelId: config?.model ?? "scribe_v2_realtime",
    reason:
      config === undefined
        ? "ELEVENLABS_API_KEY is not configured; browser speech recognition fallback should be used."
        : undefined,
  };

  response.json(payload);
});

app.post("/api/stt/elevenlabs/session", async (_request, response) => {
  if (!isElevenLabsRealtimeSttConfigured()) {
    response.status(503).json({
      error:
        "ElevenLabs realtime STT is not configured; browser speech recognition fallback should be used.",
    });
    return;
  }

  try {
    const session = await createElevenLabsRealtimeSttSession(
      getElevenLabsRealtimeSttConfig(),
    );
    const payload: RealtimeSttSessionResponse = session;

    response.json(payload);
  } catch (error) {
    response.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Unknown ElevenLabs realtime STT session error.",
    });
  }
});

app.post("/api/stt/elevenlabs/recorded", async (request, response) => {
  if (!isElevenLabsRealtimeSttConfigured()) {
    response.status(503).json({
      error:
        "ElevenLabs STT is not configured; browser speech recognition fallback should be used.",
    });
    return;
  }

  const audio = Buffer.isBuffer(request.body) ? request.body : undefined;

  if (!audio || audio.byteLength === 0) {
    response.status(400).json({ error: "Audio body is required." });
    return;
  }

  try {
    const transcription = await transcribeElevenLabsAudio({
      config: getElevenLabsRealtimeSttConfig(),
      audio,
      contentType: request.headers["content-type"] ?? "audio/webm",
    });
    const payload: RecordedSttResponse = {
      provider: "elevenlabs",
      text: transcription.text,
    };

    response.json(payload);
  } catch (error) {
    console.info("[elevenlabs-stt] Recorded transcription request failed.", {
      error: error instanceof Error ? error.message : String(error),
      bytes: audio.byteLength,
      contentType: request.headers["content-type"] ?? "unknown",
    });
    response.status(502).json({
      error:
        error instanceof Error
          ? error.message
          : "Unknown ElevenLabs speech-to-text error.",
    });
  }
});

app.post("/api/voice-turn", async (request, response) => {
  const parsed = parseVoiceTurnRequest(request.body);

  if (!parsed.ok) {
    response.status(400).json({ error: parsed.error });
    return;
  }

  const turn = await createQuestBrainTurn({
    transcript: parsed.transcript,
    questState: parsed.questState,
    getClaudeProvider: () => providerRegistry.getTextProvider("claude"),
  });
  const reply = turn.reply;
  const payload: VoiceTurnResponse = {
    transcript: parsed.transcript,
    reply,
    action: turn.action,
    actor: turn.actor,
    trigger: turn.trigger,
    event: turn.event,
    previousQuestState: turn.previousQuestState,
    nextQuestState: turn.nextQuestState,
  };

  try {
    const tts = providerRegistry.getTextToSpeechProvider("elevenlabs");
    const audio = await tts.synthesizeSpeech({
      text: reply,
      voiceId: tts.voiceIds[getElevenLabsVoiceRoleForActor(turn.actor)],
      voiceSettings: getElevenLabsVoiceSettingsForActor(turn.actor),
    });

    payload.audio = {
      contentType: audio.contentType,
      base64: Buffer.from(audio.audio).toString("base64"),
      provider: "elevenlabs",
    };
  } catch (error) {
    payload.audioError =
      error instanceof ProviderConfigurationError
        ? "ElevenLabs is not configured; browser speech fallback can answer this turn."
        : error instanceof Error
          ? error.message
          : "Unknown ElevenLabs text-to-speech error.";
  }

  response.json(payload);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API server listening on http://localhost:${port}`);
});

function parseVoiceTurnRequest(
  body: unknown,
):
  | { ok: true; transcript: string; questState: QuestState }
  | { ok: false; error: string } {
  const candidate = body as Partial<VoiceTurnRequest> | undefined;
  const transcript =
    typeof candidate?.transcript === "string" ? candidate.transcript.trim() : "";

  if (!transcript) {
    return { ok: false, error: "Transcript is required." };
  }

  if (transcript.length > MAX_TRANSCRIPT_LENGTH) {
    return {
      ok: false,
      error: `Transcript is too long. Limit: ${MAX_TRANSCRIPT_LENGTH} characters.`,
    };
  }

  return {
    ok: true,
    transcript,
    questState: normalizeQuestState(candidate?.questState),
  };
}

function getElevenLabsRealtimeSttConfigIfAvailable() {
  try {
    return getElevenLabsRealtimeSttConfig();
  } catch (error) {
    if (error instanceof ProviderConfigurationError) {
      return undefined;
    }

    throw error;
  }
}

function getElevenLabsVoiceRoleForActor(
  actor: QuestActor,
): "guard" | "pixel" | "room" {
  switch (actor) {
    case "guard":
      return "guard";
    case "pixel":
      return "pixel";
    case "door":
    case "system":
      return "room";
  }
}

function getElevenLabsVoiceSettingsForActor(
  actor: QuestActor,
):
  | {
      stability: number;
      similarityBoost: number;
      style: number;
      speed: number;
      useSpeakerBoost: boolean;
    }
  | undefined {
  if (actor !== "pixel") {
    return undefined;
  }

  return {
    stability: 0.42,
    similarityBoost: 0.78,
    style: 0.28,
    speed: 0.82,
    useSpeakerBoost: true,
  };
}
