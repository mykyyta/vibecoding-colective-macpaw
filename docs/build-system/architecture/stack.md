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
- `ELEVENLABS_API_KEY` stays server-side only.
- `ELEVENLABS_MCP_SERVER_URL` is used by the MCP registration helper.

## Rules

- Keep secrets server-side.
- Keep shared request/response shapes in `src/shared/`.
- Add backend routes only when the client, ElevenLabs, MCP, or webhook flow needs them.
- Keep the first demo route small enough to explain in under a minute.

