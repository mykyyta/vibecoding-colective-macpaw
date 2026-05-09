import type { QuestActor } from "../../src/shared/voice.js";
import type {
  TextGenerationProvider,
  TextGenerationResponse,
} from "../../src/server/providers/contracts.js";
import type { QuestTransitionId } from "../../src/server/quest/index.js";

export interface FakeDecision {
  transitionId: QuestTransitionId;
  actor: QuestActor;
  reply: string;
  confidence?: number;
}

export function fakeClaudeFromText(text: string): TextGenerationProvider {
  return {
    provider: "claude",
    model: "fake-claude",
    async generateText(): Promise<TextGenerationResponse> {
      return {
        provider: "claude",
        model: "fake-claude",
        text,
      };
    },
  };
}

export function fakeClaudeDecision(decision: FakeDecision): TextGenerationProvider {
  return fakeClaudeFromText(JSON.stringify(decision));
}
