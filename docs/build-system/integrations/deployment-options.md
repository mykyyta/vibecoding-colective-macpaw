---
last_updated: 2026-05-06
owner: Architect
---

# Deployment Options

This project does not have a fixed app stack yet. The default event posture is a live demo: run the prototype locally and expose it through a public HTTPS tunnel only when external services need to call back into it.

## Decision Rule

Default to **local live demo + tunnel**. Move to cloud deployment only when the demo needs a stable public backend, a long-lived MCP server, collaboration after the event, or the laptop cannot stay online.

For the CloudFront + Railway path requested on 2026-05-06, use
`docs/build-system/integrations/cloud-deployment.md` as the deployment contract.
The cloud path keeps CloudFront as the public entrypoint and Railway as the
single Express runtime.

| Need | Default choice | Why |
| --- | --- | --- |
| Live event demo | Local app + ngrok or Cloudflare Tunnel | Fastest path; avoids cloud setup while the idea is still changing. |
| Temporary webhook or MCP URL | Local app + ngrok or Cloudflare Tunnel | Gives ElevenLabs a public HTTPS URL with minimal ceremony. |
| Frontend-only demo that must stay online after the laptop closes | Vercel | Fast Git or CLI deployment, preview URLs, environment variables. |
| Public backend, API, or MCP server that should stay reachable | Railway | Simple GitHub or CLI deploy, public domain generation, normal web service model. |
| Public backend backup option | Render | Simple persistent web service hosting with public URL and env vars. |

## Option A: Local Tunnel

This is the default path for the event. Use it when the prototype can run on the developer machine and only needs a public HTTPS URL for the room, webhooks, or ElevenLabs MCP.

Good for:

- ElevenLabs MCP server testing;
- webhooks;
- local demos;
- avoiding cloud setup during early ideation.

Trade-offs:

- The laptop must stay online.
- Free or ephemeral URLs may change.
- If the URL changes, the ElevenLabs MCP server integration may need to be updated.
- Do not expose admin panels or sensitive local services.

Typical commands:

```bash
ngrok http 3000
```

or a Cloudflare Tunnel equivalent if Cloudflare is already available.

Live demo requirements:

- The local app starts with one command.
- The app reads `PORT` or documents the fixed local port.
- The tunnel URL is copied into any external tool that calls the app.
- The presenter keeps the laptop awake and connected.
- A fallback screenshot or recorded clip is useful if venue networking fails.

### Verified ngrok Flow

Current local flow:

```bash
npm run dev
ngrok http 3000
```

Verified on 2026-05-06:

- Vite UI served at `http://localhost:3000`.
- Express API served at `http://localhost:8787`.
- ngrok public URL forwarded to `http://localhost:3000`.
- Public root URL returned `HTTP 200`.
- Public `/api/status` URL returned the Express status JSON through the Vite proxy.

The tested ngrok URL was:

```text
https://shingle-washcloth-outreach.ngrok-free.dev
```

This URL is an ephemeral tunnel URL and should not be treated as stable project configuration.

Vite requires explicit allowed hosts for ngrok. The project currently allows:

```ts
allowedHosts: [".ngrok-free.dev", ".ngrok-free.app"]
```

Useful checks:

```bash
curl -I https://<ngrok-host>
curl https://<ngrok-host>/api/status
curl http://127.0.0.1:4040/api/tunnels
```

## Option B: Vercel

Use this when the project is primarily a web UI or a Next.js-style app with light serverless routes and needs to remain available after the local demo.

Good for:

- frontend demo;
- landing-free product UI;
- simple API endpoints that do not need long-lived connections;
- preview deployments from GitHub.

Trade-offs:

- Long-running SSE MCP servers may not be the best fit for serverless functions.
- Any secret used by server-side routes must be configured as a Vercel environment variable.

Prepared command shape:

```bash
npx vercel
npx vercel --prod
```

## Option C: Railway

Use this as the default cloud path when the prototype needs a public backend or MCP server that should stay reachable after the live demo.

Good for:

- Express, Fastify, Hono, FastAPI, or similar HTTP servers;
- public MCP server URL;
- apps that need a normal long-running process;
- quick GitHub or CLI deploys.

Implementation requirements:

- Server must listen on `0.0.0.0`.
- Server must use `process.env.PORT` or the equivalent in its runtime.
- Secrets must be configured as Railway service variables, not committed.
- Generate a public domain for the service before registering it in ElevenLabs.

Prepared command shape:

```bash
railway init
railway up
```

## Option D: Render

Use this as a backup for a persistent public backend if Railway is unavailable.

Good for:

- Node, Python, or Docker web services;
- stable public `onrender.com` URL;
- a conventional always-on web service model.

Implementation requirements:

- Server must bind to `0.0.0.0`.
- Server must read the platform port from the environment.
- Secrets must be configured in Render, not committed.

## Event Checklist

Before the event:

- GitHub repo is pushed and accessible.
- `.env.example` documents required secrets.
- No real `.env` file is tracked.
- `PORT` is supported by any server code we add.
- The app can run locally with one command.
- If MCP is needed, the server exposes an SSE or streamable HTTP endpoint.

At the event:

1. Start the local app.
2. Expose it with ngrok or Cloudflare Tunnel if a public URL is needed.
3. Copy the tunnel URL into ElevenLabs MCP setup if needed.
4. Run `npm run elevenlabs:mcp:create`.
5. Run `npm run elevenlabs:mcp:tools -- <mcp_server_id>` to confirm tool visibility.
6. Deploy to Vercel, Railway, or Render only if local live demo constraints fail.

## References

- [ElevenLabs MCP tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp)
- [Vercel deployments](https://vercel.com/docs/deployments/deployment-methods)
- [Vercel environment variables](https://vercel.com/docs/projects/environment-variables)
- [Railway quick start](https://docs.railway.com/quick-start)
- [Railway public networking](https://docs.railway.com/deploy/exposing-your-app)
- [Render web services](https://render.com/docs/web-services/)
- [ngrok secure tunnels](https://ngrok.com/docs/guides/share-localhost/tunnels)
- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)
