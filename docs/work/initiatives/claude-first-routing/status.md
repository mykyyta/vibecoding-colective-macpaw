---
state: complete
last_updated: 2026-05-07
owner: Planner
---

# Claude-First Quest Routing Status

## Summary

Initiative complete. Claude now receives clearer route cards, current stage, and
visible-character context, and successful no-progress actor selection no longer
depends on fallback-trigger actor hints. Backend authority over state changes,
reveal gates, transition legality, and fallback behavior remains in place.

## Packet Status

| Packet | Owner | Status | Notes |
| --- | --- | --- | --- |
| Router-Brain Contract and Safety Validators | Executor | Done | Added internal route contract, transcript facts, hard transition validators, and fake-Claude smoke coverage. |
| Claude-First Prompt and Decision Flow | Executor | Done | Added current-stage/visible-character prompt context and removed `applyTranscriptActorHints()` from successful-turn flow. |
| Regression Pass and Prompt Tuning | Executor | Done | Added bilingual smoke coverage; no additional prompt tuning needed after validation. |

## Current Decisions

- This is Initiative-scale because it changes routing contracts and needs
  multiple ordered packets.
- Claude should decide the semantic route, transition, actor, and reply for
  successful live turns.
- Backend remains authoritative for normalized quest state, transition legality,
  state mutation, forbidden reveals, final door wording, and safe fallback.
- The deterministic classifier remains as fallback and safety support, not the
  main router for valid Claude turns.
- Sofiia's two-route model stays: `sofia-hint-given` for directly addressed hint
  or help intent, and `sofia-conversation-replied` for other Sofiia-directed or
  VCC/vibe-coding context turns.
- Existing Oleg, Pixel, code `404`, and door-opening reveal gates must not be
  loosened.
- Cat small talk is available at every stage when the player addresses the cat,
  but it never progresses state and must not reveal Pixel's name, the exit-panel
  clue, or code `404` before their gates.

## Next Action

Review and commit the completed initiative changes when ready.

## Latest Handoff

Packet 1 completed on 2026-05-07.

- Added `analyzeQuestTranscript()` so fallback classification and backend
  validators use the same transcript facts.
- Added an internal Router-Brain `route` contract for Claude decisions and
  transition cards.
- Added explicit hard validators for Oleg, Pixel, code `404`, door opening, and
  Sofiia address requirements.
- Kept deterministic fallback intact.
- Added `npm run test:quest-routing` for fake-Claude accepted/rejected decision
  coverage.

Validation run:

- `npm run typecheck`
- `npm run test:quest-routing`

Packet 2 completed on 2026-05-07.

- Removed successful-turn dependence on `applyTranscriptActorHints()`.
- Made `no-progress` actor eligibility state-based across visible actors.
- Added current-stage and visible-character context to the Claude prompt.
- Clarified that Claude chooses route, transition, actor, and reply
  semantically from the transcript and current state.
- Expanded fake-Claude smoke coverage across guard name, guard hint, Pixel
  ordinary rejection, Pixel purr code reveal, Oleg code submission, Sofiia hint,
  Sofiia conversation, unaddressed help, invalid JSON fallback, and route
  mismatch fallback.

Validation run:

- `npm run typecheck`
- `npm run test:quest-routing`
- live local API smoke:
  - `Софія, що думаєш` -> `sofia-hint-given`
  - `Софія, привіт` -> `sofia-conversation-replied`
  - `чи є ідеї` -> `no-progress`

Packet 3 completed on 2026-05-07.

- Expanded `npm run test:quest-routing` into a compact Ukrainian and English
  routing matrix.
- Covered the full happy path plus Sofiia hint/conversation, unaddressed help,
  invalid JSON fallback, route mismatch fallback, premature Pixel/code reveal,
  and premature door opening.
- No additional prompt tuning was needed after the matrix passed.

Validation run:

- `npm run typecheck`
- `npm run test:quest-routing`

Cat small talk follow-up completed on 2026-05-07.

- Added `pixel-smalltalk-replied` as an always-available non-progress route for
  addressed cat turns.
- Added cat-address transcript facts for forms like `котик`, `кіт`, `cat`,
  `fluffy`, and similar.
- Kept Pixel/code/panel reveal guardrails: early cat replies may sound cat-like
  but cannot say Pixel's name, mention the exit panel, or reveal code `404`.

Sofiia Pixel-stage hint correction completed on 2026-05-07.

- Tightened Sofiia's `guardHintGiven` hint stage: after Oleg points to Pixel,
  Sofiia should only suggest addressing Pixel and talking to him calmly.
- Cat language, purring, meowing, or "Pixel's own language" are allowed only
  after Pixel rejects an ordinary request.
- Added prompt instructions and a backend guardrail for premature Sofiia cat
  language hints.

## Validation Plan

Run the smallest meaningful checks per packet:

- `npm run typecheck`
- targeted fake-Claude smoke for accepted and rejected transitions;
- bilingual happy-path routing matrix after the Claude-first flow lands;
- optional live Claude pass through the local app when credentials are
  configured and the server is running.

## Risks

- Claude may select progress transitions too eagerly unless hard validators are
  explicit and tested.
- Prompt expansion can reduce reliability or latency if transition cards become
  too verbose.
- Static deterministic fallback replies will still appear when Claude fails;
  that is acceptable, but should not be the normal path for natural addressed
  Sofiia hint requests.
- A technical-contract review by Architect may be needed if Packet 1 changes the
  public voice response shape rather than keeping route internal.
