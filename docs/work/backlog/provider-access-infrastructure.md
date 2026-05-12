---
state: done
owner: Planner
created: 2026-05-06
last_updated: 2026-05-06
---

# Provider Access Infrastructure

## Scale

Ticket.

Completed in this workspace on 2026-05-06.

This is one coherent implementation unit: prepare server-side infrastructure for calling external AI and voice providers from the local prototype. It does not change product direction and does not require multiple coordinated packets yet.

## Goal

Make the app ready to call Claude, Gemini, and ElevenLabs through a small server-side provider layer, with all real API keys kept in local `.env` only.

## Scope In

- Add server-side provider configuration that reads keys from environment variables.
- Add typed provider contracts for:
  - text generation;
  - image generation readiness;
  - ElevenLabs text-to-speech readiness.
- Add connector modules for:
  - Claude text generation;
  - Gemini text or image generation readiness;
  - ElevenLabs direct API calls.
- Add a small factory or registry that returns configured providers by name.
- Add explicit configuration errors when a required key or model is missing.
- Extend `.env.example` with placeholder variables only:
  - `CLAUDE_API_KEY`;
  - `CLAUDE_MODEL`;
  - `GEMINI_API_KEY`;
  - `GEMINI_MODEL`;
  - `ELEVENLABS_API_KEY`;
  - optional `DEMO_API_TOKEN` for paid provider endpoints exposed through a tunnel.
- Keep ElevenLabs TTS model and voice IDs as code constants, not environment
  variables.
- Add minimal server endpoints or internal smoke routes only if needed to validate the connectors.
- Keep provider calls behind Express. No browser code may receive raw provider API keys.

## Scope Out

- Do not commit real API keys, tokens, `.env`, credentials, or generated secrets.
- Do not add a database-backed credential store.
- Do not add auth, queues, background jobs, or cloud deployment.
- Do not build a broad multi-provider platform abstraction.
- Do not implement realtime ElevenLabs Speech-to-Text until a demo flow needs it.
- Do not attach ElevenLabs MCP servers to production agents as part of this ticket.

## Likely Files

- `.env.example`
- `src/server/index.ts`
- `src/server/providers/`
- `src/shared/`
- `docs/build-system/integrations/elevenlabs-mcp.md` only if the direct ElevenLabs API boundary needs to be clarified against MCP.

## Acceptance Criteria

- The app can report whether Claude, Gemini, and ElevenLabs keys are configured without exposing values.
- Provider modules fail fast with clear, actionable configuration errors when required env vars are missing.
- Claude and Gemini calls use server-side keys only.
- ElevenLabs direct API calls use server-side `ELEVENLABS_API_KEY` only.
- The ElevenLabs MCP helper remains separate from the direct ElevenLabs API connector.
- Paid provider endpoints are not casually callable from a public tunnel; either keep them internal during setup or protect them with a simple demo token.
- `npm run typecheck` passes.
- `npm run build` passes.

## Validation

Run the smallest meaningful checks:

```bash
npm run typecheck
npm run build
```

If real keys are present in local `.env`, also run one smoke check per configured provider with a tiny request and verify:

- successful response metadata;
- no secret values in logs or API responses;
- graceful error when the key is missing or invalid.

## Risks

- Public tunnel exposure can trigger paid provider usage. Mitigate with a demo token or by keeping smoke routes local-only.
- Provider SDKs can add setup time and dependency weight. Prefer `fetch` wrappers first unless an SDK materially reduces complexity.
- ElevenLabs MCP and direct ElevenLabs API calls solve different problems. Keep their docs and modules separate.
- Model names may change. Keep models configurable through `.env` and avoid hard-coding beyond safe defaults in `.env.example`.

## First Executor Packet

Goal: implement the provider access infrastructure.

Scope in:

- Create the provider contracts and connector modules.
- Wire env-based configuration.
- Extend readiness status to show configured providers.
- Add protected smoke endpoints only if needed for validation.
- Update `.env.example`.

Scope out:

- Real secrets.
- Product-specific flows.
- Realtime audio streaming.
- Persistent credential storage.

Validation:

- `npm run typecheck`
- `npm run build`
- optional local smoke checks when `.env` contains real keys.
