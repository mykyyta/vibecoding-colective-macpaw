---
last_updated: 2026-05-06
owner: Architect
---

# Baseline Stack

The baseline stack is optimized for a live demo first and cloud deployment second.

## Decision

- **Language:** TypeScript.
- **Client:** Vite + React.
- **Server:** Node.js + Express.
- **Shared contracts:** TypeScript types in `src/shared/`.
- **Local delivery:** one `npm run dev` command starts client and server.
- **External access:** expose the local client or server with ngrok or Cloudflare Tunnel when ElevenLabs, MCP, or webhooks need a public HTTPS URL.

## Why This Stack

- Fast local startup.
- Familiar browser-first UI path.
- Server boundary is available for secrets and ElevenLabs API calls.
- Express can host webhooks, API routes, and future MCP endpoints without committing to a larger framework.
- Vite keeps the frontend simple while the event idea is still unknown.

## Runtime Shape

```text
Browser
  -> Vite dev server :3000
      -> /api proxy
          -> Express server :8787
              -> ElevenLabs / MCP / webhook integrations
```

With ngrok live demo:

```text
Public ngrok URL
  -> localhost:3000
      -> Vite UI and /api proxy
          -> localhost:8787 Express API
```

For cloud deployment, build output is:

- `dist/` for the client;
- `dist/server/` for the compiled server.

## Commands

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm start
```

## Environment

- `PORT` controls the Vite client port for local demo.
- `SERVER_PORT` controls the Express API port.
- `CLAUDE_API_KEY` and `CLAUDE_MODEL` configure server-side Claude text generation.
- `GEMINI_API_KEY` and `GEMINI_MODEL` configure server-side Gemini text generation and image-generation readiness.
- `ELEVENLABS_API_KEY`, `ELEVENLABS_TTS_MODEL`, and `ELEVENLABS_DEFAULT_VOICE_ID` configure server-side ElevenLabs direct API calls.
- `ELEVENLABS_MCP_SERVER_URL` is used by the MCP registration helper.
- `DEMO_API_TOKEN` can protect paid provider endpoints if a demo route is exposed through a public tunnel.

## Provider Boundary

Direct provider API calls live under `src/server/providers/` and are called only from the Express server. The browser may receive readiness metadata, generated content, or audio responses through server routes, but it must never receive raw provider API keys.

The direct ElevenLabs connector is separate from the ElevenLabs MCP registration helper. Use the direct connector when this app calls ElevenLabs APIs. Use MCP registration when an ElevenLabs Conversational AI agent needs to call tools exposed by this project or another MCP server.

## Rules

- Keep secrets server-side.
- Keep shared request/response shapes in `src/shared/`.
- Add backend routes only when the client, direct provider APIs, MCP, or webhook flow needs them.
- Protect paid provider routes before exposing them through a public tunnel.
- Keep the first demo route small enough to explain in under a minute.
- Keep Vite `allowedHosts` compatible with ngrok tunnel domains used for live demo testing.
