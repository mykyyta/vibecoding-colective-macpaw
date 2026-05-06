---
last_updated: 2026-05-06
owner: Architect
---

# Deployment Options

This project does not have a fixed app stack yet. The deployment path should be chosen after the event task is known.

## Decision Rule

Choose the smallest path that gives the demo a public HTTPS URL.

| Need | Default choice | Why |
| --- | --- | --- |
| Local demo, webhook, or temporary MCP URL | ngrok or Cloudflare Tunnel | Fastest way to expose localhost without changing app architecture. |
| Frontend-only or Next.js-style UI with simple serverless routes | Vercel | Fast Git or CLI deployment, preview URLs, environment variables. |
| Public backend, API, or MCP server that should stay reachable | Railway | Simple GitHub or CLI deploy, public domain generation, normal web service model. |
| Public backend backup option | Render | Simple persistent web service hosting with public URL and env vars. |

## Option A: Local Tunnel

Use this when the prototype runs locally and only needs a public HTTPS URL for the event.

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

## Option B: Vercel

Use this when the project is primarily a web UI or a Next.js-style app with light serverless routes.

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

Use this as the default cloud path when the prototype needs a public backend or MCP server.

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

1. If the app is local-only, expose it with ngrok or Cloudflare Tunnel.
2. If it is frontend-only, deploy to Vercel.
3. If it needs a public backend or MCP server, deploy to Railway first.
4. Set secrets in the hosting platform.
5. Copy the public HTTPS URL into ElevenLabs MCP setup if needed.
6. Run `npm run elevenlabs:mcp:create`.
7. Run `npm run elevenlabs:mcp:tools -- <mcp_server_id>` to confirm tool visibility.

## References

- [ElevenLabs MCP tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/mcp)
- [Vercel deployments](https://vercel.com/docs/deployments/deployment-methods)
- [Vercel environment variables](https://vercel.com/docs/projects/environment-variables)
- [Railway quick start](https://docs.railway.com/quick-start)
- [Railway public networking](https://docs.railway.com/deploy/exposing-your-app)
- [Render web services](https://render.com/docs/web-services/)
- [ngrok secure tunnels](https://ngrok.com/docs/guides/share-localhost/tunnels)
- [Cloudflare Tunnel](https://developers.cloudflare.com/tunnel/)

