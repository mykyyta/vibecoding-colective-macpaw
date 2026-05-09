import type {
  TextGenerationContentBlock,
  TextGenerationProvider,
  TextGenerationRequest,
  TextGenerationResponse,
  TextGenerationUsage,
} from "./contracts.js";
import type { ClaudeProviderConfig } from "./config.js";
import { asRecord, getString, throwProviderHttpError } from "./http.js";

interface ClaudeTextBlock {
  type: "text";
  text: string;
  cache_control?: {
    type: "ephemeral";
  };
}

function parseClaudeText(payload: unknown): {
  id?: string;
  text: string;
  usage?: TextGenerationUsage;
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
    usage: parseClaudeUsage(record?.usage),
  };
}

function parseClaudeUsage(value: unknown): TextGenerationUsage | undefined {
  const usage = asRecord(value);

  if (!usage) {
    return undefined;
  }

  return {
    inputTokens: getNumber(usage.input_tokens),
    outputTokens: getNumber(usage.output_tokens),
    cacheCreationInputTokens: getNumber(usage.cache_creation_input_tokens),
    cacheReadInputTokens: getNumber(usage.cache_read_input_tokens),
  };
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toClaudeContent(request: TextGenerationRequest): string | ClaudeTextBlock[] {
  if (request.contentBlocks && request.contentBlocks.length > 0) {
    return request.contentBlocks.map(toClaudeTextBlock);
  }

  if (request.prompt !== undefined) {
    return request.prompt;
  }

  return "";
}

function toClaudeTextBlock(block: TextGenerationContentBlock): ClaudeTextBlock {
  return {
    type: "text",
    text: block.text,
    cache_control:
      block.cacheControl !== undefined
        ? { type: block.cacheControl.type }
        : undefined,
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
          messages: [{ role: "user", content: toClaudeContent(request) }],
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
        usage: parsed.usage,
      };
    },
  };
}
