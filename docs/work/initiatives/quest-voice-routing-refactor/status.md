---
state: completed
last_updated: 2026-05-07
owner: Orchestrator
---

# Quest Voice Routing Refactor Status

## Active Packet

Completed.

## Latest Handoff

Implemented the routing refactor end to end. Server routing now separates
state-changing progress from non-progress role replies, Claude no longer needs
to return a private `route`, addressed guard/cat generic non-progress decisions
preserve safe generated replies, and door replies render as room/door UI.

## Decisions

- Treat every turn as either progress or a non-progress role reply.
- Keep one Claude call per turn.
- Let Claude propose semantics and wording, while the server validates final
  event, actor, state transition, and forbidden claims.
- Preserve safe generated replies when Claude uses old generic non-progress
  labels for addressed guard or cat turns.
- Reject Sofiia hint decisions unless the transcript directly addresses Sofiia
  and contains hint/help intent.
- Reject inflected Pixel name leaks before `guard-hint-given`.

## Blockers

None.

## Friction

The partial dirty routing changes were integrated into the final refactor.

## Next Action

Review in-app behavior and commit when accepted.
