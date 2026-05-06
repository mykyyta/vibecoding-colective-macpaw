---
state: active
last_updated: 2026-05-07
owner: Planner
---

# Dialogue Variety Quality

## Purpose

Make **Exit MacPaw Space** replies feel less repetitive during repeated demo
runs, especially on the same quest stage.

The current problem is not that the quest needs reply memory. The problem is
that Claude receives strong fallback phrases and low-variation instructions, so
it often reuses the same joke shape, such as Oleg being `middleware`, even when
it is technically generating the reply.

## Outcome Shape

Claude should receive enough scene, actor, and stage context to write a fresh
short Ukrainian reply with one ironic character joke, while the backend still
owns legal quest progression.

The implementation should:

- keep Claude as the primary reply writer when configured;
- keep backend guardrails for Oleg's name, Pixel's clue, code `404`, and door
  opening;
- avoid adding reply memory, session history, databases, or repeat tracking;
- stop using fallback copy as the main stylistic anchor for Claude;
- make fallback copy itself less repetitive for provider-disabled demos.

## Why This Is Initiative-Scale

This is small technically, but it affects product feel, prompt contract, and
fallback content together. It should be planned as one initiative with a single
execution packet so the prompt, response safety, and demo validation stay
coherent.

## Scope In

- Claude quest-brain prompt copy in `src/server/quest-brain.ts`.
- Any dialogue rewrite prompt copy in `src/server/dialogue.ts` if still used by
  the active route.
- Fallback replies in `src/server/quest.ts`.
- Small helper shaping if needed to pass Claude stage facts without handing it
  fallback jokes as examples.
- Targeted smoke validation for repeated turns on the same stage.

## Scope Out

- Reply memory or anti-repeat session state.
- Databases, persistence, analytics, or long conversation history.
- New quest mechanics or extra stages.
- Frontend UI redesign.
- ElevenLabs voice or STT changes.
- Provider changes beyond the prompt payload.

## Acceptance Criteria

- Claude receives explicit instruction to write one fresh ironic joke grounded
  in the current actor and quest stage.
- Claude receives compact context about the room, actor, current state, allowed
  facts, and forbidden facts.
- Claude is not given fallback replies as examples or wording to imitate in the
  primary prompt path.
- Prompt explicitly discourages repeating the same joke families across stages:
  `middleware`, `firewall`, `deploy`, `keypad`, and generic assistant phrasing.
- Backend validation still rejects early Oleg-name reveal, early Pixel keypad
  clue, early `404`, and premature door-open claims.
- Provider-disabled fallback still completes the happy path and sounds less
  formulaic than the current copy.
- `npm run typecheck` passes.

## First Execution Unit

Goal: make Claude-generated stage replies more varied without adding memory.

Scope in:

- update `src/server/quest-brain.ts` so the prompt asks for a fresh, short,
  actor-specific Ukrainian line with one ironic joke;
- replace the prompt's raw fallback-reply anchoring with neutral transition
  facts or sanitize `allowedTransitions` before serializing them to Claude;
- raise Claude temperature enough for phrasing variety without making
  progression unsafe;
- rewrite fallback replies in `src/server/quest.ts` to avoid overusing the same
  tech-joke pattern;
- keep all existing state validation and transition rules.

Scope out:

- adding reply history, repeat tracking, or storage;
- changing frontend layout;
- changing ElevenLabs voices or STT behavior;
- broad quest refactors.

Acceptance criteria:

- repeated calls for the same stage can produce different wording when Claude
  is configured;
- fallback-only happy path still works;
- unsafe early-code and early-door cases remain blocked;
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`
- provider-disabled `/api/voice-turn` happy-path smoke;
- provider-enabled smoke with 3 repeated samples for at least:
  `ask-guard-name`, `guard-hint-given`, `pixel-ordinary-rejected`, and
  `smalltalk-replied`;
- blocked-path smoke for early `404` and premature door opening.

## Prompt Direction

The prompt should carry this intent:

```text
Write one fresh Ukrainian spoken reply for this exact quest turn.
Use the current actor, stage, visible room context, and allowed facts.
Include one small ironic joke or character beat, but do not reuse obvious
fallback wording or the same tech metaphor every time.
Avoid leaning repeatedly on middleware, firewall, deploy, keypad, or generic
assistant phrasing. If you use a tech joke, make it specific to this moment.
The reply must be maximum two short sentences and sound spoken aloud.
```

## Open Questions

- Should final line `404 accepted. Door not found, but exit found.` remain exact
  every time? Current product direction says yes, so keep it exact unless
  Strategist changes the demo promise.
