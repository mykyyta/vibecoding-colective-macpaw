export type ProviderName = "claude" | "gemini" | "elevenlabs";

export type ProviderCapability =
  | "text-generation"
  | "image-generation-readiness"
  | "text-to-speech"
  | "speech-to-text-realtime";

export interface ProviderReadiness {
  provider: ProviderName;
  configured: boolean;
  capabilities: ProviderCapability[];
  missingEnv: string[];
}

export interface TextGenerationRequest {
  prompt?: string;
  contentBlocks?: TextGenerationContentBlock[];
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenerationContentBlock {
  type: "text";
  text: string;
  cacheControl?: {
    type: "ephemeral";
  };
}

export interface TextGenerationUsage {
  inputTokens?: number;
  outputTokens?: number;
  cacheCreationInputTokens?: number;
  cacheReadInputTokens?: number;
}

export interface TextGenerationResponse {
  provider: ProviderName;
  model: string;
  text: string;
  responseId?: string;
  usage?: TextGenerationUsage;
}

export interface TextGenerationProvider {
  provider: ProviderName;
  model: string;
  generateText(request: TextGenerationRequest): Promise<TextGenerationResponse>;
}

export interface ImageGenerationReadinessProvider {
  provider: ProviderName;
  model: string;
  imageGenerationReady: boolean;
}

export interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    speed?: number;
    useSpeakerBoost?: boolean;
  };
}

export interface TextToSpeechResponse {
  provider: "elevenlabs";
  model: string;
  voiceId: string;
  audio: ArrayBuffer;
  contentType: string;
}

export interface TextToSpeechProvider {
  provider: "elevenlabs";
  model: string;
  defaultVoiceId: string;
  voiceIds: {
    dan: string;
    hoover: string;
    sofia: string;
  };
  synthesizeSpeech(
    request: TextToSpeechRequest,
  ): Promise<TextToSpeechResponse>;
}
