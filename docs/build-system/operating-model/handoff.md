---
state: in-progress
last_updated: 2026-05-06
owner: Methodologist
---

# Handoff Protocol

Handoffs should make the next role able to act without the user manually restating context.

## Handoff Contract

Every non-trivial handoff should include:

- **Trigger:** what state changed.
- **Signal:** where the durable context lives.
- **Receiver:** which role acts next.
- **Path:** why the receiver can continue without manual relay.

## State Persistence

For multi-step work:

- Product direction lives in `docs/product/product.md`.
- Operating-model rules live in `docs/build-system/operating-model/`.
- Initiative intent lives in `docs/work/initiatives/<slug>/brief.md`.
- Initiative execution state lives in `docs/work/initiatives/<slug>/status.md`.
- Chat should carry pointers and short summaries, not the only copy of decisions.

## Status Shape

Use these sections when an Initiative has a `status.md`:

- Active packet
- Latest handoff
- Decisions
- Blockers
- Friction
- Next action

## Friction

If a handoff requires manual relay, record it as Methodologist friction and update the operating model or affected skill so the next cycle is cleaner.

