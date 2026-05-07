---
state: active
last_updated: 2026-05-07
owner: Planner
---

# Claude-First Quest Routing

## Purpose

Redesign quest turn handling so Claude is the primary semantic router for the
voice quest, while the backend remains the authority for puzzle state and
forbidden reveals.

The player should be able to speak naturally. Claude should decide who the
phrase is addressed to, which route or transition fits, which actor replies, and
what that actor says. The backend should decide whether that transition is legal
for the current quest state and whether the reply violates any reveal gate.

## Current Routing Logic

Current routing is hybrid, but the local classifier still has too much routing
authority.

- `src/shared/voice.ts` defines the public voice contract: actors, trigger
  types, event types, quest state, and voice turn response shape.
- `src/server/quest.ts` owns deterministic quest state normalization, fallback
  transcript classification, allowed transition cards, fallback replies, and
  transition application.
- `classifyQuestTranscript()` currently scans normalized transcript text for
  Sofia, feminine address, Oleg, Pixel, door, name, code, VCC, purr, and
  smalltalk matches. It returns one `QuestTrigger`.
- `createQuestTurn()` uses that trigger to create a full fallback turn and may
  progress state deterministically.
- `getAllowedQuestTransitions()` builds state-based transition cards. It always
  includes `no-progress`, `smalltalk-replied`, `sofia-hint-given`, and
  `sofia-conversation-replied`, then adds progress transitions as state allows:
  `oleg-name-learned`, `guard-hint-given`, `pixel-ordinary-rejected`,
  `code-revealed`, and `door-opened`.
- `src/server/quest-brain.ts` builds a fallback turn first, then prompts Claude
  with the allowed transitions. Claude returns `transitionId`, `actor`, `reply`,
  and optional `confidence`.
- The backend validates Claude's output against allowed transition IDs, allowed
  actors, required Oleg/Pixel mentions, early code/door reveal guardrails, Sofia
  reply guardrails, and exact final door wording.
- `applyTranscriptActorHints()` and `isAllowedSofiaTransitionForTrigger()` still
  depend on the local fallback trigger. This means regex-like deterministic
  routing can decide whether Claude is even allowed to use some routes, which
  causes brittle misses such as natural Sofia hint wording falling into generic
  Sofia fallback.

## Desired System

The new system should be a Claude-first Router-Brain with backend rule
authority.

Claude receives:

- the user transcript;
- normalized current quest state;
- current stage summary;
- visible characters and character briefs;
- allowed transition cards for the current state;
- route instructions;
- forbidden facts and reply guardrails;
- selected reply language.

Claude returns:

```json
{
  "route": "guard | pixel | sofia-hint | sofia-talk | door | smalltalk | no-progress",
  "transitionId": "one allowed transition id",
  "actor": "system | guard | pixel | door | sofia",
  "reply": "spoken player-facing reply",
  "confidence": 0.0
}
```

The backend remains responsible for:

- normalizing quest state;
- deciding which transitions are allowed by state;
- applying state changes;
- rejecting forbidden reveals for Oleg, Pixel, code `404`, and door opening;
- enforcing exact final door wording;
- validating route-specific hard conditions, especially Pixel plus cat sound for
  `code-revealed` and Oleg plus known code for `door-opened`;
- validating Sofia's no-question, no-event-recap, non-game-master constraints;
- falling back to deterministic safe turns when Claude times out, returns invalid
  JSON, chooses an illegal transition, or violates a guardrail.

The deterministic classifier should remain, but as fallback and safety support,
not as the primary route authority for successful Claude turns.

## Why This Is Initiative-Scale

This changes the technical contract between transcript classification, Claude
decisioning, fallback behavior, and quest-state progression. It needs multiple
ordered packets, regression validation, and careful handoff because small
routing mistakes can reveal puzzle facts early or make the quest unplayable.

## Scope In

- Refactor quest routing so Claude is the primary semantic router.
- Keep `quest.ts` as the deterministic fallback and state-rule engine.
- Make allowed transition cards state-driven rather than fallback-trigger-driven.
- Add or update backend validators for all progress transitions and Sofia
  non-progress routes.
- Update prompt shape to include visible characters, character briefs, route
  choices, and current stage context.
- Add focused smoke coverage for routing decisions, fallback behavior, and reveal
  gates.
- Preserve current product behavior and happy path unless the new routing makes
  natural speech more robust.

## Scope Out

- New quest mechanics, new state flags, inventory, scoring, or extra characters.
- New UI controls, typed input, visible route debugger, or progress dashboard.
- Changing ElevenLabs provider setup or voice IDs.
- Changing Sofia's visual design.
- Rewriting the whole quest engine into a generic platform.
- Removing deterministic fallback.

## Acceptance Criteria

- Claude can route natural turns without relying on exact local hint phrases.
- Direct Sofia turns can become either `sofia-hint-given` or
  `sofia-conversation-replied` based on meaning, not a hardcoded hint phrase
  list.
- Unaddressed help does not route to Sofia and does not progress the quest.
- Generic greetings and name questions still teach the guard/Oleg path early.
- Oleg's name is revealed only by `oleg-name-learned`.
- Pixel's name and exit-panel clue are revealed only by `guard-hint-given`.
- Code `404` is revealed only by `code-revealed` after the transcript includes
  both a direct Pixel address and a cat sound.
- The door opens only by `door-opened` after the code is known and the player
  gives the code to Oleg.
- Invalid Claude output falls back to deterministic safe behavior.
- Existing Ukrainian and English happy paths still work.
- `npm run typecheck` passes.

## Execution Packets

### Packet 1: Router-Brain Contract and Safety Validators

Goal: make the routing contract explicit and isolate backend safety validation
from the local fallback trigger.

Scope in:

- add or refine Router-Brain decision types around route, transition, actor,
  reply, and confidence;
- make state-based allowed transitions the primary list Claude can choose from;
- identify route-specific backend validators for progress transitions and Sofia
  routes;
- preserve existing behavior while reducing dependence on
  `isAllowedSofiaTransitionForTrigger()` and fallback-trigger checks;
- add targeted fake-Claude regression coverage where practical.

Scope out:

- major prompt rewrite;
- changing user-facing replies;
- deleting deterministic fallback;
- changing client UI.

Files or areas likely touched:

- `src/shared/voice.ts`
- `src/server/quest.ts`
- `src/server/quest-brain.ts`
- existing or new targeted smoke test/script files if the project already has a
  local pattern for them.

Acceptance criteria:

- backend validation responsibilities are explicit and not hidden inside Sofia
  phrase matching;
- a Claude decision can be validated primarily by state, transition card, actor,
  and hard safety predicates;
- current happy path behavior is preserved;
- invalid fake-Claude decisions fall back safely.

Validation:

- `npm run typecheck`
- targeted fake-Claude smoke for allowed and rejected decisions:
  - Sofia addressed hint;
  - Sofia addressed conversation;
  - unaddressed help rejected from Sofia;
  - premature Pixel/code reveal rejected;
  - premature door opening rejected.

### Packet 2: Claude-First Prompt and Decision Flow

Goal: make Claude the primary semantic router for successful live turns.

Scope in:

- rewrite the quest brain prompt around visible characters, character briefs,
  current stage, route choices, allowed transitions, and backend authority;
- add `route` to Claude's JSON output if Packet 1 introduces it;
- remove successful-turn dependence on `applyTranscriptActorHints()` for actor
  eligibility where backend route validators can cover the same safety need;
- keep `createQuestTurn()` as deterministic fallback when Claude is unavailable
  or invalid;
- keep generated replies compact and actor-specific.

Scope out:

- new routes beyond the existing actors and transitions;
- changing the quest state fields;
- frontend changes.

Files or areas likely touched:

- `src/server/quest-brain.ts`
- `src/server/quest.ts` only where required by validation or transition-card
  shape.

Acceptance criteria:

- Claude receives enough context to decide whether the player is addressing
  Oleg, Pixel, Sofia, the door, the room, or nobody useful;
- natural Sofia phrases such as `Софія, чи є ідеї`, `Софія, що думаєш`, and
  `дівчино, я застряг` route as hints;
- direct Sofia smalltalk routes as Sofia conversation;
- Pixel, Oleg, and door routing are selected by Claude semantics but accepted
  only when backend rules allow them;
- fallback behavior still works if Claude times out or returns invalid JSON.

Validation:

- `npm run typecheck`
- live or fake-provider routing smoke for:
  - first guard name question;
  - Oleg-directed door request;
  - Pixel ordinary request;
  - Pixel purr reveal;
  - Oleg code submission;
  - Sofia hint;
  - Sofia conversation;
  - unaddressed help.

### Packet 3: Regression Pass and Prompt Tuning

Goal: harden the new routing behavior with focused examples and update work
status.

Scope in:

- collect a small bilingual routing matrix from the current happy path and common
  natural variations;
- tune prompt or validators only where validation shows brittleness;
- update initiative status with completed packets, validation results, and any
  remaining follow-up.

Scope out:

- broad copywriting pass;
- visual QA unless a routing change affects visible bubbles;
- committing new product direction outside this routing change.

Files or areas likely touched:

- `src/server/quest-brain.ts`
- `src/server/quest.ts`
- `docs/work/initiatives/claude-first-routing/status.md`

Acceptance criteria:

- the routing matrix passes for Ukrainian and English examples;
- Sofia no longer falls into the repeated static fallback for natural addressed
  hint requests when Claude is available;
- reveal gates remain blocked under adversarial fake-Claude outputs;
- status doc names the next unblocked action or marks the initiative complete.

Validation:

- `npm run typecheck`
- focused smoke matrix using fake Claude decisions and, when credentials are
  configured, a small live Claude pass through the local app flow.

## Dependencies

- Product direction is already accepted in `docs/product/product.md`: the quest
  listens for who the player is speaking to and how they perform the voice
  interaction.
- Existing Sofia initiative decisions remain authoritative for Sofia's character
  and constraints.
- No new provider, UI, or state persistence dependency is required.
- If Packet 1 expands the durable technical contract beyond the current code, an
  Architect review should happen before Packet 2.

## Risks

- Claude may over-route ambiguous turns to a progress transition. Backend hard
  validators must stay stricter than the prompt.
- Removing fallback-trigger gating too quickly could allow Sofia, Pixel, or door
  routes in places where the current deterministic classifier used to block
  them. Replace each removed gate with an explicit validator or a documented
  acceptance test.
- Prompt length can grow and make decisions slower or less reliable. Keep route
  cards compact and avoid example-heavy prompting unless a regression proves it
  is needed.
- Static fallback copy can still appear when Claude is unavailable or invalid.
  That is acceptable, but live successful turns should not depend on brittle
  phrase lists.

## First Execution Unit

Dispatch Packet 1 to Executor.

One-line handoff: make the Router-Brain decision and backend validation contract
explicit, preserving behavior while removing Sofia/fallback-trigger coupling as
the first safe step toward Claude-first routing.

## Open Questions

- Should `route` become a public response/debug field, or remain internal to
  `quest-brain.ts` while `transitionId` stays the public contract?
- How much deterministic direct-address validation should remain for Sofia and
  Oleg after Claude becomes primary router? The recommended starting point is to
  keep only safety-critical validators and remove phrase-list-based hint intent.
