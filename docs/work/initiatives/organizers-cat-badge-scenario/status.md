---
state: active
owner: Planner
created: 2026-05-09
last_updated: 2026-05-09
---

# Organizers Cat Badge Scenario Status

## Summary

Active initiative to replace the previous guard/Oleg and Pixel scenario with
the new organizer-led **Badge Not Found** scenario featuring Sofiia, Dan,
Hoover, and Fixel.

The scenario keeps the one-room, voice-first quest promise but changes the
social logic:

- no guard;
- no room or door spoken actor;
- Sofiia answers unaddressed turns by default;
- Dan checks the locked door and later enters the code;
- Hoover provides the Fixel clue only after direct gentle address;
- Fixel reveals the badge code only after being woken, but does not speak in
  words.

## Packet Status

| Packet | Owner | Status | Notes |
| --- | --- | --- | --- |
| Scenario Finalization | Strategist | Completed | Product Apex now reflects **Badge Not Found**, code `404`, Dan's final line, character rules, and examples for Hoover/Fixel interactions. |
| Quest Contract And Backend Routing | Codex | Completed | Shared quest contract, backend state machine, Claude routing/guardrails, fallback replies, and quest tests now use Sofiia, Dan, Hoover, and Fixel. |
| Frontend Scenario State Update | Codex | Completed | Client scene, copy, bubble actors, and badge reveal states now use Dan, Sofiia, Hoover, and Fixel. |
| Voice And Nonverbal Audio Contract | Codex | In Progress | Fixel now uses a local Sound Effects asset contract instead of TTS; provider voice roles now use Dan/Hoover/Sofiia names and no room voice; actual ElevenLabs SFX file generation is pending an explicit paid-generation run. |

## Current Decisions

- Treat this as an Initiative because it changes product direction, actor set,
  routing, state gates, and visible room states.
- Accepted scenario has been moved into the Product Apex.
- Product title remains **Exit MacPaw Space**.
- Scenario subtitle is **Badge Not Found**.
- Badge code remains `404`.
- Final Dan line is
  `Код 404. Двері відчинено. Дякуємо, що були з нами.` /
  `Code 404. Door open. Thanks for being with us.`
- Durable direction now lives in `docs/product/product.md`.
- Dan is an event organizer, not a guard.
- Sofiia is an event organizer and default responder for unaddressed turns.
- Sofiia gives puzzle hints only when directly asked for a hint or help.
- Sofiia may mention Dan early in unaddressed context replies.
- Sofiia must not mention Hoover, Fixel, the badge, or code before those facts
  are revealed through the quest path.
- Sofiia's default-responder behavior must stay split between short general
  context and explicit direct hints.
- Hoover is the white cat near the door.
- Fixel is the brown sleeping cat above or near the stage.
- Fixel is nonverbal. He may purr, grumble, or make sleepy cat sounds, but he
  must not speak words, explain the badge, or say the code.
- The LLM decides whether Hoover was addressed gently, with backend state gates
  preventing early progression.
- The LLM decides whether the player made a plausible Fixel waking attempt, with
  backend state gates preventing early code reveal.
- Fixel is visible from the start; after Hoover's clue, the badge edge appears
  under him while the code remains hidden.

## Active Constraints

- Preserve voice-only intended play.
- Preserve Ukrainian and English play without a visible language selector.
- Do not add visible command buttons, typed input, side panels, logs, or
  dashboards.
- Do not add a generic scenario engine unless a second real scenario need
  appears.
- Do not rely on real audio-emotion detection for gentleness or waking in the
  first implementation.
- Do not expose or change provider secrets.

## Next Action

Continue Packet 4 by generating and listening to the three Fixel Sound Effects
assets after explicit approval for the paid ElevenLabs generation run.

Packet 4 implementation checkpoint:

- Server voice provider roles now use `dan`, `hoover`, and `sofia`; there is no
  room or door TTS voice role.
- `system` technical fallback uses Sofiia's voice role if it ever reaches TTS,
  matching Sofiia's default-responder role instead of reintroducing a room
  voice.
- Fixel is explicitly excluded from spoken ElevenLabs TTS routing.
- Fixel turns return static `soundEffect` metadata when a mapped asset exists.
- Client speech diagnostics now use generic nonverbal-marker naming instead of
  purr-specific naming.
- Reused client character classes and keyframes were renamed from old
  guard/Pixel terms to Dan/Hoover terms.
- Scenario cleanup scan found no active `src` references to Oleg, Pixel, guard
  voice IDs, or purr-marker naming; remaining `guard` references are explicit
  "no guard" product constraints.
- Validation passed:
  - `npm run test:quest`;
  - `npm run check:scenario-purity`;
  - `npm run typecheck`;
  - `git diff --check`.

Packet 3 completion notes:

- `Character` actor props now use `dan | sofia | hoover | fixel`.
- Hoover uses the white cat visual near the door.
- Fixel uses the brown sleeping cat visual above the stage.
- The badge edge is derived from `hooverClueGiven`.
- Badge code text is only rendered after `codeRevealed`.
- The keypad only shows `404` after the door is opening or open.
- Client ambient hints and aria labels no longer use Oleg, guard, or Pixel as
  player-facing scenario terms.
- Validation passed:
  - `npm run test:quest`;
  - `npm run check:scenario-purity`;
  - `npm run typecheck`;
  - `git diff --check`;
  - local Chrome desktop and mobile screenshot smoke.

Next packet handoff:

- Goal: make spoken and nonverbal audio behavior match the stable visible cast.
- Scope in: actor-to-provider voice role mapping for Sofiia, Dan, and Hoover;
  Fixel nonverbal audio behavior; spoken names; final Dan line; fallback
  dialogue roughness; manual smoke of the happy path.
- Scope out: new scenario mechanics, new UI controls, provider secret changes,
  or redesigning room art.
- Acceptance: Sofiia, Dan, and Hoover spoken replies match the visible actor;
  Dan does not sound like a guard in content; Hoover can provide the cat clue in
  words; Fixel never speaks words and only produces nonverbal sleepy cat sounds;
  the code reveal is carried by visual state plus game state; the final line is
  the accepted organizer line.
- Validation: `npm run test:quest`; `npm run typecheck`; local happy-path smoke
  using text/API or voice where available.

## Packet 4 Detailed Execution Plan

Packet 4 should deepen the audio contract without adding new puzzle mechanics.
The key product decision is that Fixel is a nonverbal puzzle actor.

### 1. Product And Prompt Contract

Files likely touched:

- `docs/product/product.md`
- `src/server/quest/scenario/actors.ts`
- `src/server/quest/scenario/rules.ts`
- `src/server/quest/scenario/moves.ts`
- `src/server/quest/scenario/lines.ts`
- `src/server/quest/engine/prompt.ts`
- `src/server/quest/engine/guardrails.ts`

Plan:

- Make prompt instructions explicit: Fixel must not speak words.
- Keep Fixel addressable for routing and state transitions.
- For `fixel-sleeping-rejected`, use a nonverbal reply such as a short purr,
  sleepy grumble, or silence-like sound marker, not an explanatory sentence.
- For `code-revealed`, preserve the state transition but make Fixel's reply
  nonverbal; the badge visual and game state reveal `404`.
- Add a guardrail or parser normalization if needed so model-generated Fixel
  replies containing words are replaced by a canned nonverbal fallback.

Acceptance:

- Forced or fallback Fixel replies contain no explanatory wording.
- Fixel never says `404`.
- The code can still be revealed by state after a valid wake attempt.

Implementation note:

- Fixel turns should return `soundEffect` asset metadata instead of ElevenLabs
  TTS audio.
- Runtime asset URLs are:
  - `/audio/fixel-purr-soft.mp3`;
  - `/audio/fixel-grumble.mp3`;
  - `/audio/fixel-wake-mrrp.mp3`.
- The generation command is
  `npm run elevenlabs:sfx:fixel -- --yes`.
- The script intentionally requires `--yes` because ElevenLabs Sound Effects can
  consume paid credits.

### 2. Voice Route And Provider Contract

Files likely touched:

- `src/server/quest/engine/voice-adapter.ts`
- `src/server/providers/config.ts`
- `src/server/providers/contracts.ts`
- `src/client/audio/speech-synthesis.ts`
- `src/client/audio/playback.ts`

Plan:

- Keep spoken voice roles for Sofiia, Dan, and Hoover.
- Stop routing Fixel through the same spoken TTS path as Hoover/Pixel.
- Represent Fixel audio as nonverbal output. Prefer the smallest current
  implementation:
  - browser fallback may synthesize only `мрр` / `mrr`-style sounds, or skip
    speech if that sounds worse;
  - ElevenLabs path should either use a nonverbal sound prompt only if already
    supported by the current provider shape, or skip paid/new provider work.
- Do not introduce new paid voice assets or change secrets in this packet.

Acceptance:

- `getElevenLabsVoiceRole` no longer treats Fixel as a normal speaking cat.
- Browser fallback does not read a full Fixel sentence.
- Provider-disabled mode remains playable.

### 3. Dialogue Polish

Files likely touched:

- `src/server/quest/scenario/lines.ts`
- `src/server/quest/scenario/actors.ts`
- `scripts/quest-tests/brain.test.ts`

Plan:

- Tighten Dan's lines so he is clearly an organizer, not a guard.
- Keep Hoover's clue concise and cat-like, but worded: Hoover is the speaking
  cat who can say Fixel took the badge.
- Keep Sofiia's hints split between general context and direct help.
- Ensure final Dan line remains exactly:
  `Код 404. Двері відчинено. Дякуємо, що були з нами.` /
  `Code 404. Door open. Thanks for being with us.`

Acceptance:

- Canned and tested happy-path replies follow the voice roles.
- Hoover and Fixel no longer feel like two sequential talking cats.
- No room/door spoken actor reappears.

### 4. Validation

Commands:

- `npm run test:quest`
- `npm run check:scenario-purity`
- `npm run typecheck`
- `git diff --check`

Smoke:

- Happy path through text/API or voice where practical.
- Verify valid Fixel wake advances to `code-revealed` while the Fixel audible
  reply remains nonverbal.
- Verify direct Fixel without wake attempt stays rejected and nonverbal.

Completed Packet 3 handoff:

- Goal: wire the existing Dan, Sofiia, Hoover, and Fixel visuals to the new
  quest contract without redesigning the room.
- Scope in: update character actor props, bubble actor mapping, ambient copy,
  badge-edge state derived from `hooverClueGiven`, badge-code reveal state
  derived from `codeRevealed`, and door-open state derived from `doorOpen`.
- Scope out: backend routing changes, new providers, dashboards, command
  buttons, typed input, or broad room art-direction reset.
- Acceptance: the visible cast matches the new scenario, the badge edge appears
  after Hoover's clue, code `404` appears only after Fixel wakes, and desktop
  and mobile views remain coherent.
- Validation: `npm run typecheck`; local browser smoke; desktop and mobile
  screenshot inspection.

## Packet 3 Detailed Execution Plan

Packet 3 should make the existing frontend scene match the now-stable backend
contract. It should not redesign the room or revisit backend routing.

### 1. Frontend State Naming

Files likely touched:

- `src/client/types/scene.ts`
- `src/client/quest/state.ts`
- `src/client/quest/bubbles.ts`
- `src/client/copy/voice-copy.ts`

Plan:

- Replace old visual state names where practical:
  - `guardHintGiven` -> `danDoorChecked`;
  - `catIgnored` -> a cat-specific state such as `catRejected` or split into
    `hooverRejected` / `fixelSleeping` only if the UI needs distinct visuals.
- Keep `codeRevealed`, `doorOpening`, and `escaped`.
- Map backend state to room state:
  - `danDoorChecked`: Dan has inspected the panel; Hoover becomes the clear
    next visual focus.
  - `hooverClueGiven`: the badge edge under Fixel appears.
  - `codeRevealed`: Fixel has moved or rolled; badge code `404` is visible.
  - `doorOpen`: door opening / escaped state.
- Update bubble actor names:
  - `dan` should render as Dan;
  - `hoover` should render as Hoover;
  - `fixel` should render as Fixel;
  - `sofia` remains Sofiia;
  - `system` should stay a technical fallback only.
- Update ambient hints so they no longer mention Oleg, guard, Pixel, purr, or
  keypad as the primary clue.

Acceptance for this phase:

- No frontend-visible copy references Oleg, guard, or Pixel.
- The client compiles against the new `QuestActor`, `QuestEventType`, and
  `QuestState` names without compatibility shims that preserve old scenario
  terms.

### 2. Character Component Wiring

Files likely touched:

- `src/client/components/Character.tsx`
- `src/client/components/RoomScene.tsx`
- `src/client/styles/characters.css`
- `src/client/styles/responsive.css`
- `src/client/styles/conversation.css`

Plan:

- Change `Character` actor props from `guard | pixel | sofia` to
  `dan | sofia | hoover | fixel`.
- Reuse the existing human figure implementation for Dan if that is the current
  drawn Dan asset, but rename classes or wrap semantics so the component no
  longer exposes `guard` as the scenario role.
- Keep Sofiia visible and available for default responses.
- Render Hoover as the white cat near the door.
- Render Fixel as the brown/striped sleeping cat above or near the stage.
- If the current CSS already has usable drawn cat assets, preserve them and
  attach new semantic class names (`hoover`, `fixel`) instead of repainting from
  scratch.
- Keep all characters visible from the start; state changes should highlight or
  reveal details, not spawn core characters late.

Acceptance for this phase:

- The rendered scene contains Sofiia, Dan, Hoover, and Fixel at all initial
  states.
- Speech bubbles visually attach to the correct character class.
- The old `guard`/`pixel` names are gone from component props and user-facing
  aria labels.

### 3. Badge Edge And Badge Code States

Files likely touched:

- `src/client/components/RoomScene.tsx`
- `src/client/components/Character.tsx`
- `src/client/styles/characters.css`
- `src/client/styles/room.css`
- `src/client/styles/responsive.css`

Plan:

- Derive `badgeEdgeVisible` from `questState.hooverClueGiven`.
- Derive `badgeCodeVisible` from `questState.codeRevealed`.
- Show only a small badge edge under or beside Fixel after Hoover's clue.
- Keep code `404` hidden until `codeRevealed`.
- After `codeRevealed`, show the badge enough to read `404`.
- The existing exit keypad may still show `404` when the code is revealed or
  accepted, but the first reveal should visually belong to the badge, not the
  door panel.
- Avoid adding inventory UI, cards, panels, or progress chips.

Acceptance for this phase:

- Before `hooverClueGiven`, no badge is visible enough to imply the solution.
- After `hooverClueGiven`, the badge edge is visible but `404` is not.
- After `codeRevealed`, `404` is visible on the badge.
- Door/keypad visuals do not reveal `404` earlier than the badge.

### 4. Responsive Layout And Bubble Placement

Files likely touched:

- `src/client/styles/responsive.css`
- `src/client/styles/conversation.css`
- `src/client/styles/characters.css`

Plan:

- Verify character placement at desktop and mobile widths before changing
  layout.
- Ensure Hoover near the door does not overlap with the exit keypad or mic.
- Ensure Fixel on/above the stage remains visible on mobile and that the badge
  reveal is not clipped.
- Ensure Sofiia default-response bubbles do not cover the active puzzle object.
- Ensure Dan final-line bubbles and door-opening visuals do not overlap in a
  way that hides the reward.

Acceptance for this phase:

- Common mobile viewport around `390x844` has no horizontal scrolling.
- Characters, mic, active bubble, badge, keypad, and door reward remain legible.
- Desktop composition remains recognizable as the existing MacPaw Space room.

### 5. Local Browser QA

Files likely touched:

- none unless QA finds a concrete frontend issue.

Plan:

- Run `npm run typecheck`.
- Start the local dev server with `npm run dev` or the existing repo command.
- Open the app in the in-app browser.
- Verify at least desktop and mobile viewports.
- Smoke the visual state mapping using real voice where practical, or a minimal
  dev/API path if microphone support is unreliable.

Suggested visual states to verify:

- initial: Sofiia, Dan, Hoover, Fixel visible; no badge clue visible.
- after `dan-door-checked`: Hoover is the clear next focus.
- after `hoover-clue-given`: badge edge appears under Fixel; no `404`.
- after `code-revealed`: Fixel moved/woke; badge code `404` visible.
- after `door-opened`: Dan final line and door opening reward are visible.

Validation commands:

- `npm run typecheck`
- local browser smoke through `http://localhost:3000/`
- desktop screenshot inspection
- mobile screenshot inspection

Packet 3 should stop after visual/state integration. Actor-specific ElevenLabs
voice mapping and dialogue polish belong to Packet 4.

## Packet 2 Detailed Execution Plan

Packet 2 should be implemented as one backend/shared contract change. The
frontend should not be rewired until the backend names and response contract are
stable.

### 1. Shared Contract

Files likely touched:

- `src/shared/voice.ts`
- `src/server/quest/index.ts`
- `src/server/quest/engine/parser.ts`

Plan:

- Replace scenario actors with `sofia`, `dan`, `hoover`, and `fixel`.
- Remove `guard`, `pixel`, and `door` from player-facing quest actors.
- Keep `system` only if the API still needs a non-character fallback actor, but
  do not use it for normal scenario replies.
- Replace `QuestState` fields:
  - remove `olegNameKnown`;
  - remove `guardHintGiven`;
  - remove `pixelRejectedOrdinaryCommand`;
  - keep `codeRevealed`;
  - keep `doorOpen`;
  - add `danDoorChecked`;
  - add `hooverClueGiven`;
  - add `fixelWakeAttempted` only if the implementation needs to distinguish
    "Fixel was addressed but not woken" from generic no-progress;
  - prefer not adding a separate `badgeEdgeVisible` field because the frontend
    can derive it from `hooverClueGiven`.
- Replace event types with:
  - `chitchat-replied`;
  - `sofia-hint-given`;
  - `dan-door-checked`;
  - `hoover-ordinary-rejected`;
  - `hoover-clue-given`;
  - `fixel-sleeping-rejected`;
  - `code-revealed`;
  - `door-opened`.

Acceptance for this phase:

- TypeScript no longer exposes Oleg/guard/Pixel event or state names in the
  shared quest contract.
- Existing API response shape remains compatible where possible: same
  `VoiceTurnResponse` envelope, new actor/event/state values inside it.

### 2. State Normalization And Transition Gates

Files likely touched:

- `src/server/quest/engine/state.ts`
- `src/server/quest/engine/transitions.ts`
- `scripts/quest-tests/state.test.ts`
- `scripts/quest-tests/transitions.test.ts`

Plan:

- Define normalized state dependencies:
  - `danDoorChecked` can stand alone after a direct Dan door/check/code-panel
    request.
  - `hooverClueGiven` requires `danDoorChecked`.
  - `codeRevealed` requires `hooverClueGiven`.
  - `doorOpen` requires `codeRevealed`.
- Make `dan-door-checked` available when `!danDoorChecked`.
- Make `hoover-ordinary-rejected` available after `danDoorChecked` and before
  `hooverClueGiven`.
- Make `hoover-clue-given` available after `danDoorChecked` and before
  `hooverClueGiven`.
- Make `fixel-sleeping-rejected` available after `hooverClueGiven` and before
  `codeRevealed`.
- Make `code-revealed` available after `hooverClueGiven` and before
  `codeRevealed`.
- Make `door-opened` available after `codeRevealed` and before `doorOpen`.

Acceptance for this phase:

- Early Hoover cannot reveal Fixel before Dan's clue.
- Early Fixel cannot reveal the code before Hoover's clue.
- Dan cannot open the door before the code has been revealed.
- State tests prove invalid partial states are stripped.

### 3. Transcript Facts And Deterministic Fallback

Files likely touched:

- `src/server/quest/engine/classifier.ts`
- `src/server/quest/engine/fallback.ts`
- `src/server/quest/engine/chitchat.ts`
- `src/server/quest/scenario/aliases.ts`
- `scripts/quest-tests/classifier.test.ts`

Plan:

- Replace Oleg/Pixel facts with:
  - `hasDan`;
  - `hasHoover`;
  - `hasFixel`;
  - `hasSofiaAddress`;
  - `hasDoor`;
  - `hasCode404`;
  - `hasCodeIntent`;
  - `hasGentleHooverAddress`;
  - `hasWakeAttempt`.
- Keep deterministic fallback conservative:
  - unaddressed turns should return Sofiia context through `chitchat-replied`;
  - direct Sofiia help should use `sofia-hint-given`;
  - direct Dan door/check/code-panel requests can progress to
    `dan-door-checked`;
  - direct Hoover without clear gentleness should use
    `hoover-ordinary-rejected`;
  - direct Hoover plus obvious gentle phrasing may progress to
    `hoover-clue-given`;
  - direct Fixel without wake intent should use `fixel-sleeping-rejected`;
  - direct Fixel plus obvious wake intent may progress to `code-revealed`;
  - Dan plus `404` can open only after `codeRevealed`.
- Let Claude be more semantically flexible than fallback for gentleness and
  wake attempts, but keep fallback able to complete the happy path with obvious
  examples from Product Apex.

Acceptance for this phase:

- `npm run test:quest:classifier` covers Dan, Hoover, Fixel, Sofiia, gentle
  Hoover wording, wake attempts, and early `404`.
- Provider-disabled fallback can complete a simple Ukrainian and English happy
  path.

### 4. Scenario Data, Replies, And Hints

Files likely touched:

- `src/server/quest/scenario/actors.ts`
- `src/server/quest/scenario/lines.ts`
- `src/server/quest/scenario/moves.ts`
- `src/server/quest/scenario/hints.ts`
- `src/server/quest/scenario/story.ts`
- `src/server/quest/scenario/rules.ts`
- `src/server/quest/scenario/routing.ts`
- `src/server/quest/scenario/secrets.ts`
- `src/server/quest/scenario/style.ts`

Plan:

- Replace story title with **Badge Not Found**.
- Define personas for Sofiia, Dan, Hoover, and Fixel.
- Remove room/door persona usage from normal scenario replies.
- Replace canned replies for the new transitions in Ukrainian and English.
- Set the final line to:
  - `Код 404. Двері відчинено. Дякуємо, що були з нами.`
  - `Code 404. Door open. Thanks for being with us.`
- Update Sofiia hint stages:
  - initial/general: point toward Dan only;
  - after Dan clue: suggest addressing Hoover calmly, but do not mention Fixel,
    badge, or code until Hoover reveals them;
  - after Hoover clue: suggest waking Fixel without saying the code;
  - after code reveal: suggest telling Dan.
- Keep hints short, non-questioning, and non-chatbot-like.

Acceptance for this phase:

- No canned reply mentions Oleg, Pixel, guard, purring as a required mechanic,
  room voice, or door voice.
- Sofiia never mentions Hoover, Fixel, badge, or `404` before the relevant
  state.

### 5. Claude Prompt, Parser, And Guardrails

Files likely touched:

- `src/server/quest/engine/brain.ts`
- `src/server/quest/engine/prompt.ts`
- `src/server/quest/engine/parser.ts`
- `src/server/quest/engine/guardrails.ts`
- `scripts/quest-tests/brain.test.ts`

Plan:

- Update allowed actor validation to new actor ids.
- Update prompt visible-character summary for Sofiia, Dan, Hoover, and Fixel.
- Update route descriptions so Claude understands:
  - no-address defaults to Sofiia context, not room/system;
  - Sofiia hints require direct Sofiia address plus help/idea intent;
  - Hoover gentleness is semantic, not just keyword matching;
  - Fixel waking may be loud or playful, not necessarily gentle;
  - Dan is the only actor who opens the door.
- Replace old guardrails:
  - remove Oleg name reveal guardrail;
  - remove Pixel name/keypad reveal guardrail;
  - add early Hoover/Fixel/badge/code blockers for Sofiia and Dan;
  - block `404` before `codeRevealed`;
  - block door-open claims before `doorOpen`;
  - force exact final Dan line on `door-opened`.
- Ensure `door-opened` actor is `dan`, not `door`.

Acceptance for this phase:

- Fake-Claude tests cover invalid early code reveal, invalid early door opening,
  invalid early Sofiia mention of Hoover/Fixel/badge/code, valid gentle Hoover,
  valid Fixel wake, and forced final Dan line.
- Invalid Claude output still falls back to a safe deterministic turn.

### 6. Scenario Purity And Compatibility Sweep

Files likely touched:

- `scripts/check-scenario-purity.ts`
- any quest tests that assert old names.

Plan:

- Update scenario purity checks so old names are forbidden in active scenario
  data where appropriate.
- Allow historical mentions only in work docs or migration notes, not runtime
  scenario prompts/replies.
- Run the smallest complete validation set for Packet 2.

Validation commands:

- `npm run test:quest:state`
- `npm run test:quest:transitions`
- `npm run test:quest:classifier`
- `npm run test:quest:brain`
- `npm run check:scenario-purity`
- `npm run typecheck`

Packet 2 should stop after backend/shared contract validation. Frontend rewiring
belongs to Packet 3, using the final actor/event/state names from this packet.

## Risks

- Sofiia may become a generic chatbot if default unaddressed routing is not
  constrained.
- Dan may feel like a renamed guard unless his organizer role and door-panel
  constraint are clear.
- Hoover and Fixel can collapse into two sequential locks unless their behavior
  and voices feel different.
- LLM-only gentleness and waking judgments need backend state gates so creative
  replies cannot reveal the code early.
- Frontend and backend may temporarily disagree until Packet 3 is completed.

## Planned Smoke Cases

- Start state + unaddressed `відкрий двері` routes to Sofiia, gives general
  context, and does not progress to Hoover or reveal code.
- Start state + `Софіє, дай підказку` routes to Sofiia hint and points toward
  Dan without solving the puzzle.
- Start state + `Dan, can you check the door?` progresses to Dan's door-check
  result and Hoover clue.
- Before Dan's clue + direct Hoover request does not reveal Fixel or code.
- After Dan's clue + rough Hoover command does not reveal Fixel or code.
- After Dan's clue + gentle Hoover request reveals that Fixel took the badge.
- After Hoover's clue + `Фіксель, дай код` does not reveal the code if it does
  not plausibly wake him.
- After Hoover's clue + `Гей, Фіксель, прокидайся` wakes Fixel and reveals the
  badge code.
- Before code reveal + `Dan, code 404` does not open the door.
- After code reveal + player gives the code to Dan opens the door.
- After code reveal + player gives the code to Dan returns
  `Код 404. Двері відчинено. Дякуємо, що були з нами.` or
  `Code 404. Door open. Thanks for being with us.` based on reply language.

## Latest Validation

- Documentation-only initiative creation. No code validation required yet.
- Scenario decision update captured title, subtitle, code, final Dan line,
  Sofiia routing constraints, and Hoover's white-cat affordance.
- Packet 1 completed: `docs/product/product.md` now captures the accepted
  **Badge Not Found** scenario, character rules, gentleness examples, waking
  examples, code `404`, and Dan's final bilingual line.
- Packet 2 completed: shared actors are now `sofia`, `dan`, `hoover`, and
  `fixel`; quest state is `danDoorChecked`, `hooverClueGiven`, `codeRevealed`,
  and `doorOpen`; backend transitions, deterministic fallback, Claude prompt
  routing, parser validation, guardrails, and quest tests have been updated.
- Validation after Packet 2:
  - `npm run test:quest` passed.
  - `npm run check:scenario-purity` passed.
  - `npm run typecheck` passed.
