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
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TextGenerationResponse {
  provider: ProviderName;
  model: string;
  text: string;
  responseId?: string;
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
    room: string;
    sofia: string;
  };
  synthesizeSpeech(
    request: TextToSpeechRequest,
  ): Promise<TextToSpeechResponse>;
}
