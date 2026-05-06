import type {
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResponse,
} from "./contracts.js";
import type { ClaudeProviderConfig } from "./config.js";
import { asRecord, getString, throwProviderHttpError } from "./http.js";

function parseClaudeText(payload: unknown): {
  id?: string;
  text: string;
} {
  const record = asRecord(payload);
  const content = Array.isArray(record?.content) ? record.content : [];
  const text = content
    .map((item) => asRecord(item))
    .filter((item): item is Record<string, unknown> => {
      return item !== undefined;
    })
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n")
    .trim();

  return {
    id: getString(record?.id),
    text,
  };
}

export function createClaudeTextProvider(
  config: ClaudeProviderConfig,
): TextGenerationProvider {
  return {
    provider: "claude",
    model: config.model,
    async generateText(
      request: TextGenerationRequest,
    ): Promise<TextGenerationResponse> {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "x-api-key": config.apiKey,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: request.maxTokens ?? 256,
          temperature: request.temperature,
          messages: [{ role: "user", content: request.prompt }],
        }),
      });

      if (!response.ok) {
        await throwProviderHttpError("Claude", response);
      }

      const parsed = parseClaudeText((await response.json()) as unknown);

      return {
        provider: "claude",
        model: config.model,
        responseId: parsed.id,
        text: parsed.text,
      };
    },
  };
}
