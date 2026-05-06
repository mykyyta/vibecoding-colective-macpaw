# Vibecoding Collective

Vibecoding Collective is a live-demo workspace for quickly building a small AI-assisted prototype with voice, audio, and conversational interaction at the center of the experience.

The current prototype is **Exit MacPaw Space**, a short voice-operated quest room. The player is locked inside a simplified MacPaw Space room after a demo and must escape by speaking to the right characters in the right way. Voice is the main interaction: spoken commands move the room state forward, character names matter, and ElevenLabs-powered speech closes the loop when configured.

## Demo Promise

- A fullscreen quest-room scene, not a dashboard.
- Voice-first player input with minimal UI chrome.
- Distinct spoken characters for the guard, Pixel the cat, and the room.
- A small, explainable happy path that can be shown live in a few minutes.
- Local-first delivery, with a public HTTPS tunnel only when external callbacks need it.

## Tech Snapshot

- TypeScript
- Vite + React
- Node.js + Express
- ElevenLabs-ready server boundary for secrets, TTS, webhooks, and MCP integration

## Run Locally

```bash
npm install
npm run dev
```

Default local URLs:

- UI: `http://localhost:3000`
- API: `http://localhost:8787`

For public demo access, expose the local UI with ngrok or Cloudflare Tunnel.

## Project Docs

- `docs/product/product.md` is the product source of truth.
- `docs/readme.md` indexes the documentation system.
- `docs/build-system/integrations/elevenlabs-mcp.md` explains the ElevenLabs MCP setup.
- `AGENTS.md` and `CLAUDE.md` define agent workflow rules.
