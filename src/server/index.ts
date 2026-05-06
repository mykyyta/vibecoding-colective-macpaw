import "dotenv/config";

import express from "express";
import type { AppStatus } from "../shared/status.js";

const app = express();
const port = Number(process.env.SERVER_PORT || process.env.PORT || 8787);

app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/status", (_request, response) => {
  const status: AppStatus = {
    app: "Vibecoding Collective",
    mode: "live-demo",
    serverTime: new Date().toISOString(),
    environment: {
      elevenLabsApiKeyConfigured: Boolean(process.env.ELEVENLABS_API_KEY),
      elevenLabsMcpServerUrlConfigured: Boolean(
        process.env.ELEVENLABS_MCP_SERVER_URL,
      ),
      port,
    },
  };

  response.json(status);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`API server listening on http://localhost:${port}`);
});

