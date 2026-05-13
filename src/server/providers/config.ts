import type { ProviderName, ProviderReadiness } from "./contracts.js";

type EnvSource = NodeJS.ProcessEnv;

export class ProviderConfigurationError extends Error {
  readonly provider: ProviderName;
  readonly missingEnv: string[];

  constructor(provider: ProviderName, missingEnv: string[]) {
    super(
      `${provider} provider is not configured. Missing environment variable${missingEnv.length === 1 ? "" : "s"}: ${missingEnv.join(", ")}`,
    );
    this.name = "ProviderConfigurationError";
    this.provider = provider;
    this.missingEnv = missingEnv;
  }
}

export interface ClaudeProviderConfig {
  apiKey: string;
  model: string;
}

export interface GeminiProviderConfig {
  apiKey: string;
  model: string;
}

export interface ElevenLabsProviderConfig {
  apiKey: string;
  ttsModel: string;
  defaultVoiceId: string;
  voiceIds: {
    dan: string;
    hoover: string;
    sofia: string;
    sofiaEnglish?: string;
  };
}

export interface ElevenLabsRealtimeSttConfig {
  apiKey: string;
  model: string;
}

const DEFAULT_ELEVENLABS_TTS_MODEL = "eleven_v3";
const DEFAULT_ELEVENLABS_STT_MODEL = "scribe_v2_realtime";
const ELEVENLABS_VOICE_IDS = {
  dan: "CwhRBWXzGAHq8TQ4Fs17",
  hoover: "bIHbv24MWmeRgasZH58o",
  sofia: "bg0e02brzo3RVUEbuZeo",
} as const;

function readEnv(env: EnvSource, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function missingEnv(env: EnvSource, keys: string[]): string[] {
  return keys.filter((key) => readEnv(env, key) === undefined);
}

function requireProviderEnv(
  provider: ProviderName,
  env: EnvSource,
  keys: string[],
): void {
  const missing = missingEnv(env, keys);

  if (missing.length > 0) {
    throw new ProviderConfigurationError(provider, missing);
  }
}

export function getClaudeConfig(env: EnvSource = process.env): ClaudeProviderConfig {
  requireProviderEnv("claude", env, ["CLAUDE_API_KEY", "CLAUDE_MODEL"]);

  return {
    apiKey: readEnv(env, "CLAUDE_API_KEY")!,
    model: readEnv(env, "CLAUDE_MODEL")!,
  };
}

export function getGeminiConfig(env: EnvSource = process.env): GeminiProviderConfig {
  requireProviderEnv("gemini", env, ["GEMINI_API_KEY", "GEMINI_MODEL"]);

  return {
    apiKey: readEnv(env, "GEMINI_API_KEY")!,
    model: readEnv(env, "GEMINI_MODEL")!,
  };
}

export function getElevenLabsConfig(
  env: EnvSource = process.env,
): ElevenLabsProviderConfig {
  requireProviderEnv("elevenlabs", env, ["ELEVENLABS_API_KEY"]);

  const voiceIds = {
    dan:
      readEnv(env, "ELEVENLABS_DAN_VOICE_ID") ??
      readEnv(env, "ELEVENLABS_DEFAULT_VOICE_ID") ??
      ELEVENLABS_VOICE_IDS.dan,
    hoover:
      readEnv(env, "ELEVENLABS_HOOVER_VOICE_ID") ??
      readEnv(env, "ELEVENLABS_PIXEL_VOICE_ID") ??
      ELEVENLABS_VOICE_IDS.hoover,
    sofia: readEnv(env, "ELEVENLABS_SOFIA_VOICE_ID") ?? ELEVENLABS_VOICE_IDS.sofia,
    sofiaEnglish:
      readEnv(env, "ELEVENLABS_SOFIA_EN_VOICE_ID") ??
      readEnv(env, "ELEVENLABS_ROOM_VOICE_ID"),
  };

  return {
    apiKey: readEnv(env, "ELEVENLABS_API_KEY")!,
    ttsModel: DEFAULT_ELEVENLABS_TTS_MODEL,
    defaultVoiceId: readEnv(env, "ELEVENLABS_DEFAULT_VOICE_ID") ?? voiceIds.dan,
    voiceIds,
  };
}

export function getElevenLabsRealtimeSttConfig(
  env: EnvSource = process.env,
): ElevenLabsRealtimeSttConfig {
  requireProviderEnv("elevenlabs", env, ["ELEVENLABS_API_KEY"]);

  return {
    apiKey: readEnv(env, "ELEVENLABS_API_KEY")!,
    model: readEnv(env, "ELEVENLABS_STT_MODEL") ?? DEFAULT_ELEVENLABS_STT_MODEL,
  };
}

export function isElevenLabsRealtimeSttConfigured(
  env: EnvSource = process.env,
): boolean {
  return missingEnv(env, ["ELEVENLABS_API_KEY"]).length === 0;
}

export function getProviderReadiness(
  env: EnvSource = process.env,
): ProviderReadiness[] {
  const claudeMissing = missingEnv(env, ["CLAUDE_API_KEY", "CLAUDE_MODEL"]);
  const geminiMissing = missingEnv(env, ["GEMINI_API_KEY", "GEMINI_MODEL"]);
  const elevenLabsMissing = missingEnv(env, ["ELEVENLABS_API_KEY"]);

  return [
    {
      provider: "claude",
      configured: claudeMissing.length === 0,
      capabilities: ["text-generation"],
      missingEnv: claudeMissing,
    },
    {
      provider: "gemini",
      configured: geminiMissing.length === 0,
      capabilities: ["text-generation", "image-generation-readiness"],
      missingEnv: geminiMissing,
    },
    {
      provider: "elevenlabs",
      configured: elevenLabsMissing.length === 0,
      capabilities: ["text-to-speech", "speech-to-text-realtime"],
      missingEnv: elevenLabsMissing,
    },
  ];
}
