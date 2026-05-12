---
state: active
owner: Strategist
created: 2026-05-12
last_updated: 2026-05-12
---

# Scenario Character Voices

## Purpose

Rework character voice and dialogue style on top of the already
shipped **Organizers Cat Badge Scenario** so that every reply sounds
like a specific character with a specific tone, rather than a
generically ironic chatbot.

Two things are out of place today:

- The four characters (Sofiia, Dan, Hoover, Fixel) share a single
  global irony directive in `style.ts` and therefore sound similar in
  chitchat.
- Sofiia is currently a calm facilitator who reacts only when the
  player speaks first or asks for a hint. The product owner wants
  Sofiia to feel positive, optimistic, and proactive — checking in
  with the player about their progress at each stage.

A second smaller change rides along: Dan no longer raises the badge
himself. He stays in vibe-coding mode unless the player directly asks
about the badge, the lost badge, the code, or how to leave. The Dan
trigger transition is therefore renamed from `dan-door-checked` to
`dan-badge-asked` to match the new semantics.

## Outcome Shape

After this initiative:

- **First turn is a Sofiia self-introduction.** Regardless of how the
  player starts, Sofiia takes the first reply: she introduces
  herself ("I'm Sofiia"), introduces Dan ("this is Dan"), says the
  door is closed and they need the player's help to leave. Name
  tags for Sofiia and Dan appear over both characters on that
  reply. Subsequent turns route normally.
- Sofiia knows about the badge and that it was at Dan from the
  start, and proactively checks in on the player's progress at
  each stage. She remains warm, optimistic, and trusts the player.
- Dan ignores the badge unless directly asked. In ordinary chitchat
  he talks about the event and vibe coding, with no badge or door
  framing. When the player asks Dan about the badge / code /
  how-to-leave, he briefly points to Hoover and slips back into
  vibe-coding talk.
- **Character activation is strictly sequential and visible.** The
  player can only address a character whose name tag is visible:
  - At start: Sofiia and Dan are addressable (after Sofiia's intro
    reveals their tags).
  - After `dan-badge-asked` fires: Hoover becomes addressable and
    his name tag appears.
  - After `hoover-clue-given` fires: Fixel becomes addressable and
    his name tag appears.
  Pre-activation addresses to Hoover or Fixel are softly redirected
  to Sofiia chitchat; the addressed cat does not speak.
- Hoover and Fixel keep their existing puzzle mechanics. Their voice
  becomes more distinct: Hoover stays observant and lightly smug,
  Fixel remains fully nonverbal but with character expressed through
  sound and timing.
- The global "dry irony" style block in `style.ts` is removed; humor
  lives inside each persona instead.
- An anti-template rule prevents repeated phrasings and generic
  assistant wording across the session.

## Scenario Updates

### Parent Rule Changes

This initiative mutates four specific parent rules from
`organizers-cat-badge-scenario`. All other parent rules remain
unchanged.

1. The `rules.ts` clause "Before dan-door-checked, nobody may
   mention Hoover, Fixel, the badge, or the code" is **split**:
   the badge clause is removed (Sofiia may mention the badge from
   the start), the rest stays.
2. The `dan-door-checked` token in `rules.ts`, `routing.ts`, and
   `moves.ts` text is **renamed** to `dan-badge-asked`.
3. The `rules.ts` clause "Sofiia's default-responder role…" is
   **extended**: Sofiia opens with the intro reply on turn 1
   regardless of address, and her chitchat is proactive in tone.
4. A new clause is **added**: Hoover and Fixel cannot speak as
   actors before their predecessor transition fires. Pre-activation
   addresses must route to Sofiia.

The `hoover-clue-given` contract and the `code-revealed` /
`door-opened` contracts are unchanged.

### Why `sofiaIntroduced` Is A Real State Field

The flag could be derived from "all other flags false," but a real
field is preferred because:

- `getAllowedQuestTransitions` reads one boolean instead of four,
  and the intro-only branch becomes a single-line check.
- Future puzzle stages that add new flags will not silently break
  the "first-turn" detection.
- It matches the existing monotonic-dependency style in
  `normalizeQuestState` rather than introducing a parallel
  derivation pattern.

### Other Statement Changes And Additions

Compared to the current `organizers-cat-badge-scenario` brief, the
following statements change or are added:

- A new initial transition `sofia-introduced` runs as the first
  reply of the session. It fires on the player's first turn
  regardless of address, sets a new state flag `sofiaIntroduced`,
  reveals the Sofiia and Dan name tags, and produces a Sofiia
  self-introduction line that also introduces Dan and frames the
  door-closed problem.
- Until `sofiaIntroduced` is true, every other transition is
  illegal; the engine routes the first turn to `sofia-introduced`
  no matter what the player said or who they addressed.
- A new state field `sofiaIntroduced: boolean` is added with the
  same monotonic dependency style as the existing flags. It
  becomes the first link in the chain (`sofiaIntroduced` →
  `danBadgeAsked` → `hooverClueGiven` → `codeRevealed` →
  `doorOpen`).
- Sofiia knows about the badge and Dan's ownership from the start.
  Sofiia may mention the badge and Dan from her opening turn.
- Sofiia must still not mention Hoover, Fixel, or code 404 before
  those facts are revealed through the quest path.
- Dan must not raise the badge or door topic himself. Until the
  player directly asks, Dan stays in vibe-coding chitchat.
- The trigger for Dan revealing the Hoover clue is now any direct
  Dan address with a badge / lost badge / code / how-to-leave intent.
- Transition id `dan-door-checked` is renamed to `dan-badge-asked`
  in `shared/voice.ts`, scenario, state, replies, hints, tests, and
  docs. The state flag `danDoorChecked` is renamed to
  `danBadgeAsked`.
- Pre-activation addresses to Hoover (before `danBadgeAsked` is
  true) and Fixel (before `hooverClueGiven` is true) route to
  Sofiia chitchat with a soft redirect. The addressed cat must not
  speak.

## Scope In

### Shared contract and state

- Rename `QuestEventType` member `dan-door-checked` to
  `dan-badge-asked` in `src/shared/voice.ts`.
- Rename `QuestState` field `danDoorChecked` to `danBadgeAsked`.
- Add `QuestState` field `sofiaIntroduced: boolean` as the first
  link in the dependency chain (`sofiaIntroduced` → `danBadgeAsked`
  → `hooverClueGiven` → `codeRevealed` → `doorOpen`).

### Engine gating (real logic changes, not mechanical)

- `src/server/quest/engine/state.ts`: extend `initialQuestState`
  and `normalizeQuestState` for `sofiaIntroduced` and the rename.
- `src/server/quest/engine/transitions.ts`: update
  `getAllowedQuestTransitions` so that when `!sofiaIntroduced` it
  returns only `sofia-introduced`. After intro, the existing
  allowed-transitions logic resumes.
- `src/server/quest/engine/chitchat.ts`: update `getChitchatActor`
  so cat actors are gated behind their activation flags — Hoover
  only when `danBadgeAsked`, Fixel only when `hooverClueGiven`.
  Pre-activation cat addresses resolve to `sofia`.
- `src/server/quest/engine/brain.ts`: extend `filterNameTagActors`
  so Sofiia and Dan name tags require `sofiaIntroduced`. Carry
  the rename through.

### Scenario data

- Add new transition `sofia-introduced` to
  [moves.ts](../../../../src/server/quest/scenario/moves.ts) with
  a describe block that the LLM cannot misread.
- Update [routing.ts](../../../../src/server/quest/scenario/routing.ts)
  to document: first-turn intro-only routing, the Dan badge intent
  trigger, and the pre-activation Hoover/Fixel redirect.
- Update [rules.ts](../../../../src/server/quest/scenario/rules.ts)
  per the Parent Rule Changes section above.
- Expand the four personas in
  [actors.ts](../../../../src/server/quest/scenario/actors.ts) into
  full voice cards with Role / Personality / Tone / Signature beats /
  Humor / Never / Examples sections.
- Adjust `chitchatFallback` for Hoover and Fixel in `actors.ts` to
  fall back to the Sofiia redirect reply when their preconditions
  are not met yet.
- Move global irony out of
  [style.ts](../../../../src/server/quest/scenario/style.ts) and
  add an anti-template rule.
- Add new `QuestReplyId`s for the intro line and the
  Hoover/Fixel pre-activation redirect lines in
  [lines.ts](../../../../src/server/quest/scenario/lines.ts).
- Rewrite chitchat and hint fallback texts in `lines.ts` so they
  match the new voices and Sofiia's proactive tone.

### Tests, docs, and validation

- Rewrite `scripts/quest-tests/state.test.ts` for the new state
  shape and dependency chain (not a "refresh" — full rewrite).
- Rewrite `scripts/quest-tests/transitions.test.ts` to cover the
  intro-only first turn and the pre-activation redirects.
- Update `scripts/quest-tests/brain.test.ts` for the renamed event
  type, new transition, and extended `filterNameTagActors`.
- Add a grep-based smoke check (or extend
  `scripts/check-scenario-purity.ts`) that fails on any remaining
  literal `dan-door-checked` or `danDoorChecked` strings — the
  current purity check is import-only and will not catch stale
  text in prompts or describe blocks.
- Update `docs/product/product.md` to reflect Sofiia's earlier
  knowledge of the badge, Dan's non-raising behavior, the intro
  turn, and the strict activation sequence.
- Update any `docs/work/initiatives/organizers-cat-badge-scenario/`
  cross-references that name `dan-door-checked` or `danDoorChecked`.

## Scope Out

- Server-pushed proactive Sofiia messages between turns. Sofiia's
  proactivity here is tone-only: she speaks when chosen as the
  chitchat actor or directly addressed. The first-turn intro is
  still a reply to a player turn, not an unsolicited server push.
- Engine gating changes are allowed where the new scenario
  requires them — specifically `getAllowedQuestTransitions`
  returning only `sofia-introduced` while `!sofiaIntroduced`,
  `getChitchatActor` gating Hoover and Fixel behind their
  activation flags, and `filterNameTagActors` requiring
  `sofiaIntroduced` for Sofiia and Dan tags. **Out of scope:**
  changes to `parser.ts` shape, `prompt.ts` assembly,
  `classifier.ts`, `guardrails.ts` evaluation, `language.ts`,
  `voice-adapter.ts`, `fallback.ts` algorithm, `chitchat.ts`
  algorithm beyond the actor gate, or `index.ts`.
- A second cat scenario or new mechanics.
- Removing canned fallbacks entirely; this change rewrites their
  text but keeps them as emergency safety net.
- Real audio-emotion detection.
- New state fields beyond `sofiaIntroduced` and the rename of
  `danDoorChecked` to `danBadgeAsked`.
- Client-side gating of name-tag visibility. The current
  `revealNameTags` reads server-returned `nameTagActors` and is
  monotonic; gating is enforced server-side via
  `filterNameTagActors`.

## Why This Is Initiative-Scale

This is not just a copy edit. It changes:

- a product rule (Sofiia's earlier badge knowledge);
- the Dan trigger semantics and a public event type id;
- the global style block and the per-persona voice contract;
- multiple files across scenario, shared types, tests, and docs.

It therefore warrants its own brief, packet structure, and
acceptance gates.

## Acceptance Criteria

- On the player's first turn, the engine fires `sofia-introduced`,
  Sofiia self-introduces, introduces Dan, frames the
  door-closed/help problem, and reveals the Sofiia and Dan name
  tags. This holds even if the player addresses Dan directly on
  the first turn.
- If the LLM returns a non-intro transition on turn 1, the backend
  rejects it via `getAllowedQuestTransitions` and falls back to
  `sofia-introduced` rather than letting the wrong transition
  execute.
- After `sofia-introduced` has fired, the system never re-fires it
  in the same session.
- Sofiia's opening intro mentions the badge and Dan as its previous
  owner in both UK and EN.
- Dan's chitchat replies talk about the event or vibe coding
  without raising the badge or door.
- A direct Dan address asking about the badge / code / how-to-leave
  fires `dan-badge-asked` and reveals the Hoover clue plus the
  Hoover name tag.
- Pre-activation Hoover address (before `dan-badge-asked` is true)
  produces a Sofiia chitchat redirect, not a Hoover reply, and does
  not reveal the Hoover name tag.
- Pre-activation Fixel address (before `hoover-clue-given` is true)
  produces a Sofiia chitchat redirect, not a Fixel reply, and does
  not reveal the Fixel name tag.
- Each persona's chitchat fallback contains at least one signature
  lexical or structural marker (e.g. Sofiia: warm proactive
  check-in starter; Dan: vibe-coding reference such as
  "prompt"/"agent"/"Cursor"/"вайбкодинг"; Hoover: cat-language
  punctuation and observational beat; Fixel: nonverbal only) that
  is absent from the other personas' fallback set.
- Code 404, Hoover, Fixel, and the cat chain remain hidden until
  their respective transitions fire.
- All quest tests under `scripts/quest-tests/` pass.
- `scripts/check-scenario-purity.ts` passes AND the grep smoke
  step finds zero remaining `dan-door-checked` or `danDoorChecked`
  string literals across the repo (excluding this initiative's
  status archive once retired).
- Both UK and EN happy paths complete in the running app.
- `docs/product/product.md` and the relevant initiative status are
  updated in the same change set.

## Execution Packets

Packets are ordered to minimize file churn: the rename lands first
(touches the largest set of files mechanically), then voice/style
edits compound on a stable token set, then Sofiia rules, then the
new intro and pre-activation mechanic, then validation.

### Packet 1: Dan Trigger Rename And Vibe-Coding Default

Goal: rename `dan-door-checked` to `dan-badge-asked` everywhere
that ships, switch Dan's default chitchat to vibe-coding talk, and
prevent Dan from raising the badge himself.

Scope in:

- rename event type in `shared/voice.ts`;
- rename state flag `danDoorChecked` to `danBadgeAsked` in
  `shared/voice.ts`, `engine/state.ts`, `client/quest/state.ts`,
  and any other consumers;
- update `moves.ts`, `routing.ts`, `rules.ts`, `hints.ts`, and
  `lines.ts` references;
- update `filterNameTagActors` in `brain.ts` to reference the
  renamed flag (still gating only Hoover, no new behavior here);
- update Dan's chitchat fallback line in `lines.ts` to vibe-coding
  default;
- update `rules.ts` so Dan never raises the badge himself;
- update `docs/product/product.md` and the
  `organizers-cat-badge-scenario/status.md` cross-references;
- update all affected tests in `scripts/quest-tests/`.

Scope out:

- new state fields;
- new transitions;
- voice card expansion;
- intro mechanic.

Acceptance criteria:

- repo-wide grep for `dan-door-checked` and `danDoorChecked`
  returns zero hits (excluding closed historical status notes);
- the renamed transition fires on a Dan-directed badge / code /
  how-to-leave intent;
- Dan never raises the badge himself in chitchat;
- all existing tests pass with the rename.

### Packet 2: Voice Cards And Style Reframing

Goal: rewrite character voices per persona, remove global irony,
add anti-template rule.

Scope in:

- expand all four personas in `actors.ts` to voice cards
  (Role / Personality / Tone / Signature beats / Humor / Never /
  Examples);
- remove the global irony block in `style.ts` and add an
  anti-template rule;
- update `docs/product/product.md` to reflect per-persona voice.

Scope out:

- transition or routing changes;
- rule changes about Sofiia's badge knowledge.

Acceptance criteria:

- each persona's fallback set carries at least one signature marker
  absent from the other personas' fallback set;
- all existing tests still pass.

### Packet 3: Sofia Opening Knowledge And Proactive Tone

Goal: Sofiia knows about the badge and Dan from the start, and her
fallback replies feel like proactive optimistic check-ins.

Scope in:

- update `rules.ts` per the Parent Rule Changes section: split the
  "no badge mention" clause so Sofiia may mention the badge and
  Dan early; keep the Hoover/Fixel/code prohibition;
- rewrite Sofiia-related entries in `lines.ts` (context, hints,
  conversation) to be proactive and optimistic;
- update `docs/product/product.md` accordingly.

Scope out:

- server-pushed messages;
- intro mechanic and pre-activation routing.

Acceptance criteria:

- Sofiia's `sofia-context-initial` line mentions the badge and Dan
  in both languages;
- Sofiia still does not mention Hoover, Fixel, or code 404 before
  those reveal transitions.

### Packet 4: First-Turn Intro And Strict Pre-Activation Routing

Goal: enforce that the first player turn always produces a Sofiia
self-introduction, and that Hoover and Fixel cannot be addressed
before their predecessor transition fires.

Scope in:

- add state field `sofiaIntroduced` in `shared/voice.ts` and
  `engine/state.ts` as the new first link of the dependency chain;
  every later flag's normalization gains a `sofiaIntroduced &&`
  prefix;
- add transition `sofia-introduced` in `moves.ts` and `routing.ts`;
- change `engine/transitions.ts` so `getAllowedQuestTransitions`
  returns `["sofia-introduced"]` while `!sofiaIntroduced`;
- change `engine/chitchat.ts` so `getChitchatActor` resolves to
  `sofia` when the requested chitchat actor is `hoover` and
  `!danBadgeAsked`, or `fixel` and `!hooverClueGiven`;
- extend `filterNameTagActors` in `brain.ts` so Sofiia and Dan
  tags require `sofiaIntroduced`;
- add `QuestReplyId`s for the intro line and the Hoover/Fixel
  pre-activation redirect lines in `lines.ts`, with UK and EN
  text;
- adjust `chitchatFallback` for Hoover and Fixel in `actors.ts`
  to return the Sofiia redirect line when their preconditions are
  not met;
- rewrite `scripts/quest-tests/state.test.ts` for the new state
  shape and dependency chain;
- rewrite `scripts/quest-tests/transitions.test.ts` to cover the
  intro-only first turn and the pre-activation redirects;
- update `scripts/quest-tests/brain.test.ts` for the new
  `filterNameTagActors` gates and the new transition;
- update `docs/product/product.md`.

Scope out:

- the Dan rename (already done in Packet 1);
- voice card expansion (already done in Packet 2);
- Sofiia badge-knowledge rule change (already done in Packet 3).

Acceptance criteria:

- first turn of a session always fires `sofia-introduced` and
  reveals both Sofiia and Dan name tags, even when the player's
  first transcript is a Dan-directed door command;
- if the LLM returns a non-intro transition on turn 1, the parser
  rejects it and the fallback executes `sofia-introduced`;
- `sofia-introduced` cannot fire twice in the same session;
- pre-activation Hoover and Fixel addresses produce a Sofiia
  chitchat reply, not a cat reply, and do not reveal a cat name
  tag.

### Packet 5: Validation

Goal: smoke and manual verification.

Scope in:

- run `scripts/quest-tests/run-all.ts`;
- run `scripts/check-scenario-purity.ts`;
- run a repo-wide grep smoke that fails on any remaining
  `dan-door-checked` or `danDoorChecked` literals (add the step
  to a script if it does not yet exist);
- manual UK and EN happy paths against a running dev server,
  including: (a) first turn addressing Dan directly still produces
  the intro; (b) pre-activation Hoover/Fixel address yields a
  Sofiia redirect; (c) full path to the final Dan line;
- update `status.md` with results.

Scope out:

- new tests beyond what Packets 1-4 already produced.

Acceptance criteria:

- all checks green;
- both happy paths reach the final Dan line in both languages;
- grep smoke is wired into either `check-scenario-purity.ts` or a
  sibling script and is invoked in the validation run.
