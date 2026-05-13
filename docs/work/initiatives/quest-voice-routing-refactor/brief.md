---
state: active
last_updated: 2026-05-13
owner: Orchestrator
---

# Quest Voice Routing Refactor

## Purpose

Simplify voice turn routing so the quest is easier to reason about and less
likely to repeat static fallback lines.

## Outcome Shape

Each voice turn resolves to one of two outcomes:

- **Progress:** a legal quest transition changes `QuestState`.
- **Role reply:** the addressed role answers without changing `QuestState`.

Sofiia hints are role replies with a hint subtype, not progress.

Claude remains a single call per turn when available. It may propose semantic
intent, addressee, transition, actor, and reply, but the server owns final state
validation, event selection, actor selection, and forbidden-reveal guardrails.

## Why Initiative-Scale

The work touches shared API types, server routing, Claude validation, fallback
behavior, smoke tests, and client actor rendering. These changes have ordering
dependencies and should be accepted packet by packet.

## Scope In

- Stabilize addressed guard and cat small talk.
- Preserve safe generated role replies when Claude chooses an old generic
  non-progress route.
- Keep progress transitions deterministic and state-gated.
- Make Sofiia hint behavior deterministic-safe and semantically clear.
- Remove the private Claude `route` requirement.
- Fix door actor rendering on the client.
- Update routing smoke coverage.

## Scope Out

- New quest steps or puzzle mechanics.
- New visible UI controls.
- Voice provider or ElevenLabs infrastructure changes.
- Broad visual redesign.

## Acceptance Criteria

- Direct guard/Oleg non-progress turns resolve to a guard role reply.
- Direct cat/Pixel non-progress turns resolve to a Pixel role reply.
- Explicit help or stuck requests produce staged Sofiia hints without
  advancing state, even when unaddressed.
- Ordinary unaddressed chitchat remains Sofiia chitchat, not a hint.
- Progress events are the only events that mutate `QuestState`.
- Claude output no longer needs a separate `route` field.
- Door replies render as door/room, not as the guard.
- `npm run test:quest-routing`, `npm run typecheck`, and `npm run build` pass.

## First Execution Unit

Refactor the current dirty routing changes into a coherent server contract:
role replies for addressed non-progress turns, progress-only state mutation,
and a simplified Claude decision contract.

## Open Questions

- Whether to remove legacy `smalltalk-replied` entirely in a future cleanup or
  keep it for unaddressed generic greetings.
