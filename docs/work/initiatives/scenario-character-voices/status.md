---
state: active
owner: Planner
created: 2026-05-12
last_updated: 2026-05-12
---

# Scenario Character Voices Status

## Summary

Active initiative to layer per-persona voice cards, an optimistic
proactive Sofiia with a mandatory first-turn self-introduction,
strict pre-activation routing for Hoover and Fixel, a vibe-coding
default Dan, and the `dan-door-checked` → `dan-badge-asked` rename
on top of the already shipped organizers-cat-badge scenario.

## Packet Status

| # | Packet | Owner | Status | Notes |
| --- | --- | --- | --- | --- |
| 1 | Dan Trigger Rename And Vibe-Coding Default | unassigned | Not started | Lands first to minimize churn on files Packets 2–4 will touch. |
| 2 | Voice Cards And Style Reframing | unassigned | Not started | Voice cards in `actors.ts`, global irony removed from `style.ts`. |
| 3 | Sofia Opening Knowledge And Proactive Tone | unassigned | Not started | Splits the parent rule about badge mention; rewrites Sofiia fallbacks. |
| 4 | First-Turn Intro And Strict Pre-Activation Routing | unassigned | Not started | Adds new `sofiaIntroduced` state flag and `sofia-introduced` transition; changes `getAllowedQuestTransitions` and `getChitchatActor`. |
| 5 | Validation | unassigned | Not started | Includes a grep smoke for stale rename literals. |

## Current Decisions

- Work happens on `feat/scenario-character-voices-badge-trigger` off
  `develop`.
- Packets are ordered to land the rename first, then voice/style,
  then Sofiia rules, then the intro mechanic and pre-activation
  routing. This minimizes churn on files that later packets
  re-touch.
- The first player turn of a session always fires a new
  `sofia-introduced` transition, regardless of address. Sofiia
  self-introduces, introduces Dan, and frames the door-closed
  problem.
- A new state field `sofiaIntroduced` is added as the first link
  of the dependency chain. It is preferred over deriving "first
  turn" from "all other flags false" because it keeps the
  intro-only check single-boolean, matches the existing monotonic
  style, and remains future-safe when new flags appear.
- Enforcement is on the engine side, not just the prompt:
  `getAllowedQuestTransitions` returns only `sofia-introduced`
  while `!sofiaIntroduced`, and `getChitchatActor` gates Hoover
  and Fixel behind their activation flags. These are real logic
  changes, not mechanical edits — explicitly inside scope.
- Character activation is strictly sequential: Sofiia and Dan after
  intro, Hoover after `dan-badge-asked`, Fixel after
  `hoover-clue-given`. Pre-activation addresses to Hoover or Fixel
  are softly redirected to Sofiia chitchat and do not reveal the
  cat's name tag.
- Sofiia knows about the badge and Dan's ownership from the start
  of the quest.
- Dan never raises the badge himself; only a direct Dan address
  about the badge / code / how-to-leave triggers the Hoover clue.
- Proactivity for Sofiia is tone-only in this initiative; no
  server-pushed messages between turns.
- Transition `dan-door-checked` is renamed to `dan-badge-asked`
  through `shared/voice.ts`, scenario, state, tests, and docs.
- The corresponding state flag is renamed from `danDoorChecked` to
  `danBadgeAsked`.
- Global irony directive moves out of `style.ts` and into
  per-persona voice cards in `actors.ts`.
- Canned reply text in `lines.ts` is rewritten in the new voices
  but the existing reply IDs and contract remain. New IDs are
  added only for the intro line and the pre-activation redirects.
- The blind 3-line read criterion was dropped in favor of a
  concrete per-persona signature-marker rubric (see
  `brief.md` Acceptance Criteria).
- `scripts/check-scenario-purity.ts` is import-only and will not
  catch stale rename strings; a grep smoke step is added as a
  validation gate.

## Active Constraints

- Engine logic changes are allowed only where the brief lists them:
  `getAllowedQuestTransitions`, `getChitchatActor`,
  `filterNameTagActors`, and the rename-related edits in
  `state.ts` and `brain.ts`. No edits to `parser.ts`,
  `prompt.ts`, `classifier.ts`, `guardrails.ts`, `language.ts`,
  `voice-adapter.ts`, `fallback.ts` algorithm, or `index.ts`.
- Do not introduce server-pushed proactive replies between player
  turns.
- Preserve UK and EN play.
- Preserve voice-first intended play.
- Keep code 404, Hoover, Fixel, and the cat chain gated.
- Keep existing canned reply IDs and contract; only rewrite their
  text and add the minimal new IDs needed.

## Content Source Of Truth

Voice cards, all UK/EN reply drafts, anti-template rules, and
edge-case decisions live in
[content.md](./content.md). It is the canonical text reference
for `actors.ts`, `lines.ts`, and `style.ts` until the initiative
completes.

## Next Action

Review brief and content. Once approved, start Packet 1 — Dan
Trigger Rename And Vibe-Coding Default.
