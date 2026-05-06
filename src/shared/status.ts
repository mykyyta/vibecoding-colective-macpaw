export interface AppStatus {
  app: string;
  mode: "live-demo";
  serverTime: string;
  environment: {
    elevenLabsApiKeyConfigured: boolean;
    elevenLabsMcpServerUrlConfigured: boolean;
    port: number;
  };
}

