export type ProviderStatusName = "claude" | "gemini" | "elevenlabs";

export interface ProviderStatus {
  provider: ProviderStatusName;
  configured: boolean;
  capabilities: string[];
  missingEnv: string[];
}

export interface AppStatus {
  app: string;
  mode: "live-demo";
  serverTime: string;
  environment: {
    claudeApiKeyConfigured: boolean;
    geminiApiKeyConfigured: boolean;
    elevenLabsApiKeyConfigured: boolean;
    elevenLabsMcpServerUrlConfigured: boolean;
    port: number;
  };
  providers: ProviderStatus[];
}
