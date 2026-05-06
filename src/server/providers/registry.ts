import {
  getClaudeConfig,
  getElevenLabsConfig,
  getGeminiConfig,
  getProviderReadiness,
} from "./config.js";
import type {
  ImageGenerationReadinessProvider,
  ProviderName,
  ProviderReadiness,
  TextGenerationProvider,
  TextToSpeechProvider,
} from "./contracts.js";
import { createClaudeTextProvider } from "./claude.js";
import { createElevenLabsTextToSpeechProvider } from "./elevenlabs.js";
import {
  createGeminiImageReadinessProvider,
  createGeminiTextProvider,
} from "./gemini.js";

interface ProviderRegistry {
  getReadiness(): ProviderReadiness[];
  getTextProvider(provider: "claude" | "gemini"): TextGenerationProvider;
  getImageGenerationReadinessProvider(
    provider: "gemini",
  ): ImageGenerationReadinessProvider;
  getTextToSpeechProvider(provider: "elevenlabs"): TextToSpeechProvider;
}

export function createProviderRegistry(
  env: NodeJS.ProcessEnv = process.env,
): ProviderRegistry {
  return {
    getReadiness() {
      return getProviderReadiness(env);
    },
    getTextProvider(provider: "claude" | "gemini") {
      switch (provider) {
        case "claude":
          return createClaudeTextProvider(getClaudeConfig(env));
        case "gemini":
          return createGeminiTextProvider(getGeminiConfig(env));
      }
    },
    getImageGenerationReadinessProvider(provider: "gemini") {
      return createGeminiImageReadinessProvider(getGeminiConfig(env));
    },
    getTextToSpeechProvider(provider: "elevenlabs") {
      return createElevenLabsTextToSpeechProvider(getElevenLabsConfig(env));
    },
  };
}

export function assertKnownProvider(provider: string): asserts provider is ProviderName {
  if (!["claude", "gemini", "elevenlabs"].includes(provider)) {
    throw new Error(`Unknown provider: ${provider}`);
  }
}
