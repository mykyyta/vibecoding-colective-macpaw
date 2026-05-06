---
state: active
last_updated: 2026-05-07
owner: Planner
---

# Dialogue Variety Quality Status

## Summary

Initiative opened to reduce repetitive Claude-generated and fallback quest
replies without adding reply memory.

## Packet Status

| Packet | Owner | Status | Notes |
| --- | --- | --- | --- |
| Claude Prompt Variety Pass | Codex | Completed | Removed fallback-copy anchoring from the Claude quest-brain prompt, added compact stage context and fresh ironic joke guidance, raised Claude variation, rewrote fallback copy, and validated typecheck plus smoke paths. |

## Current Decisions

- Do not add memory, repeat tracking, persistence, or conversation history.
- Keep Claude as the primary reply writer when configured.
- Keep backend state and guardrails authoritative.
- Treat fallback replies as emergency/provider-disabled copy, not as examples
  Claude should imitate.
- Keep the final door line exact for now: `404 accepted. Door not found, but
  exit found.`

## Next Action

No further packet is needed for the no-memory variety pass. Optional follow-up:
run a live demo with real microphone input and tune the prompt if Claude drifts
into a new repeated joke family.

## Latest Validation

- `npm run typecheck` passed.
- Provider-enabled `/api/voice-turn` smoke on `SERVER_PORT=8891` produced
  varied Claude replies without the old `middleware` line and kept `404`
  blocked before Pixel revealed it.
- Provider-disabled direct `createQuestBrainTurn` smoke completed the fallback
  happy path through generic door command, Oleg name, guard hint, Pixel ordinary
  rejection, blocked early code, purr code reveal, and final door opening.

## Risks

- Raising Claude creativity can accidentally push it toward forbidden facts;
  keep backend validation unchanged.
- Removing fallback wording from Claude context can make replies vague unless
  stage facts are explicit.
- Over-instructing style can create a new repetitive pattern. Keep the style
  prompt short and give it context, not catchphrases.
