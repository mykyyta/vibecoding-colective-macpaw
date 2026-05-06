import type {
  ImageGenerationReadinessProvider,
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResponse,
} from "./contracts.js";
import type { GeminiProviderConfig } from "./config.js";
import { asRecord, getString, throwProviderHttpError } from "./http.js";

function parseGeminiText(payload: unknown): string {
  const record = asRecord(payload);
  const candidates = Array.isArray(record?.candidates) ? record.candidates : [];

  return candidates
    .flatMap((candidate) => {
      const content = asRecord(asRecord(candidate)?.content);
      const parts = Array.isArray(content?.parts) ? content.parts : [];

      return parts
        .map((part) => getString(asRecord(part)?.text))
        .filter((text): text is string => text !== undefined);
    })
    .join("\n")
    .trim();
}

export function createGeminiTextProvider(
  config: GeminiProviderConfig,
): TextGenerationProvider {
  return {
    provider: "gemini",
    model: config.model,
    async generateText(
      request: TextGenerationRequest,
    ): Promise<TextGenerationResponse> {
      const endpoint = new URL(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent`,
      );
      endpoint.searchParams.set("key", config.apiKey);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: request.prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: request.maxTokens ?? 256,
            temperature: request.temperature,
          },
        }),
      });

      if (!response.ok) {
        await throwProviderHttpError("Gemini", response);
      }

      return {
        provider: "gemini",
        model: config.model,
        text: parseGeminiText((await response.json()) as unknown),
      };
    },
  };
}

export function createGeminiImageReadinessProvider(
  config: GeminiProviderConfig,
): ImageGenerationReadinessProvider {
  return {
    provider: "gemini",
    model: config.model,
    imageGenerationReady: true,
  };
}
