---
state: active
owner: Strategist
created: 2026-05-09
last_updated: 2026-05-09
---

# Organizers Cat Badge Scenario

## Purpose

Rework the opening quest scenario for **Exit MacPaw Space** around event
organizers and cats instead of a guard-led locked-room puzzle.

The new scenario should keep the product small and voice-first, but change the
social shape of the room: Sofiia and Dan are event organizers trying to find a
way out with the player, while Hoover and Fixel create the playful obstacle.

The product title remains **Exit MacPaw Space**. The scenario subtitle becomes
**Badge Not Found**: it keeps the HTTP-style joke from `404 Door Not Found`, but
moves the focus to the new badge mechanic.

## Outcome Shape

The player is still in the MacPaw Space room after a vibe-coding event, but
there is no guard and no room or door voice.

Visible characters:

- **Sofiia**: event organizer and default responder for unaddressed turns.
- **Dan**: event organizer who can inspect the door and enter the code once the
  player has found it.
- **Hoover**: the white cat near the door or exit area. Hoover was seen near the
  door and becomes the first cat clue.
- **Fixel**: the brown cat sleeping above or near the stage. Fixel has the
  organizer badge underneath him and does not speak in words.

The scenario should feel like a small collaborative after-event problem, not a
security checkpoint. The goal is to get out of the room by talking to the right
person or cat in the right way.

## Scenario Draft

Happy path:

1. The player says a generic door command or asks what is going on.
2. Because there is no explicit addressee, Sofiia answers with general context:
   the event is over, the door seems locked, and Dan may know more about the
   door panel.
3. The player asks Dan to open the door, check the door, or enter a code.
4. Dan checks the door and says it looks like a code lock. He cannot open it
   yet, but he noticed Hoover hanging around near the door.
5. The player addresses Hoover directly.
6. Hoover does not move the quest forward until the player addresses him gently.
   The LLM decides whether the wording is sufficiently gentle from semantics and
   tone implied by the transcript.
7. When addressed gently, Hoover says that Fixel took the badge.
8. Fixel is visible from the start, sleeping above or near the stage. After
   Hoover points to Fixel, the visual state reveals the edge of a badge under
   Fixel, but the code is still hidden.
9. The player addresses Fixel and tries to wake him. The LLM may accept natural
   waking attempts including direct wake requests, calls, exclamations such as
   `hey`, `гей`, or `boo`, and other plausible ways a person might wake a cat.
   The waking action does not need to be gentle.
10. Fixel wakes lazily or rolls over with only a sleepy cat sound. The badge
    becomes visible and reveals code `404`.
11. The player tells the code to Dan.
12. Dan enters the code, opens the door, and closes the event with the final
    line:

    - Ukrainian: `Код 404. Двері відчинено. Дякуємо, що були з нами.`
    - English: `Code 404. Door open. Thanks for being with us.`

This ending should feel like an organizer closing the event, not a guard
granting escape.

## Product Rules

- Voice remains the only intended player input.
- The room does not speak. There is no room actor and no door actor for spoken
  replies.
- Unaddressed turns route to Sofiia by default.
- Sofiia gives short general context for ordinary unaddressed turns.
- Sofiia gives hints only when the player directly asks Sofiia for a hint, idea,
  help, advice, or next step.
- Sofiia should not solve the puzzle, name the code, wake Fixel, or make Dan's
  action unnecessary.
- Sofiia may mention Dan early in unaddressed context replies because Dan is the
  natural door-panel person.
- Sofiia must not mention Hoover, Fixel, the badge, or code `404` before the
  player reaches those facts through the quest path.
- Sofiia's default-responder role must stay split into two modes:
  short general context for unaddressed turns, and direct hints only when the
  player explicitly asks Sofiia for help.
- Dan is not a guard. He is an organizer who can inspect the door and use the
  code panel.
- Dan should feel competent but constrained by the missing badge or code.
- The badge code is `404`.
- Hoover can reveal the Fixel clue only after a direct, gentle Hoover-addressed
  turn.
- Hoover is described as white from the start because the visible cat asset is
  an affordance, not only a style choice.
- Fixel's badge edge appears only after Hoover points to Fixel.
- Fixel reveals the badge code only after a plausible waking attempt.
- Fixel is nonverbal: he may purr, grumble, or make sleepy cat sounds, but he
  must not speak words or explain the badge/code.
- The code must not be accepted by Dan before the badge code has been revealed.
- The quest should continue to work in Ukrainian and English without a visible
  language selector.

## Why This Is Initiative-Scale

This is more than a dialogue rewrite. It changes the core scenario, actor set,
default routing behavior, state gates, visual states, and backend safety rules.

Expected workstreams:

- product scenario update and Product Apex alignment;
- shared quest contract update for actors, transitions, state, and reveal gates;
- backend routing and LLM validation update;
- frontend character and visual-state update;
- voice and nonverbal audio mapping update for Dan, Sofiia, Hoover, and Fixel;
- regression smoke for Ukrainian and English happy paths.

## Scope In

- Replace Oleg/guard and Pixel-led scenario with Sofiia, Dan, Hoover, and Fixel.
- Remove room/door spoken responses from the scenario.
- Route unaddressed player turns to Sofiia.
- Add Dan door-check and code-entry behavior.
- Add Hoover gentle-address gate.
- Add Fixel wake gate.
- Add visual badge-edge and badge-code reveal states.
- Preserve one-room, short quest structure.
- Preserve bilingual voice play.
- Use scenario subtitle **Badge Not Found**.
- Keep code `404`.
- Use Dan's final payoff line:
  `Код 404. Двері відчинено. Дякуємо, що були з нами.` /
  `Code 404. Door open. Thanks for being with us.`

## Scope Out

- Multiple rooms.
- Inventory UI.
- Visible command buttons, typed input, side panels, or progress dashboards.
- New scoring systems.
- Persistent story memory.
- Cloud deployment changes.
- Real audio-emotion detection as a hard dependency for gentleness or waking.
- Rebuilding the quest as a generic scenario engine before the second real
  scenario need appears.

## Acceptance Criteria

- The new scenario can be described as one small happy path that a casual player
  can understand.
- The player can complete the quest using only voice.
- Unaddressed turns receive Sofiia responses, not system, room, or door
  responses.
- Direct Dan turns can progress from door inspection to the Hoover clue.
- Hoover reveals the Fixel clue only after a direct and gentle Hoover-addressed
  turn.
- The badge edge appears after Hoover's clue, while the code remains hidden.
- Fixel reveals the badge code only after a plausible waking attempt.
- Dan opens the door only after the badge code is revealed and the player gives
  that code to Dan.
- Ukrainian and English happy paths are covered by smoke cases.
- The final Dan payoff line is implemented in Ukrainian and English.
- Durable product truth is moved to `docs/product/product.md` before the
  implementation is treated as complete.

## Execution Packets

### Packet 1: Scenario Finalization

Goal: turn the draft scenario into accepted product direction.

Scope in:

- keep **Exit MacPaw Space** as the product title and set **Badge Not Found** as
  the scenario subtitle;
- define Dan, Sofiia, Hoover, and Fixel character briefs;
- preserve code `404` and Dan's final payoff line;
- define examples of acceptable Hoover gentleness and Fixel waking turns in
  Ukrainian and English;
- update `docs/product/product.md` after the scenario is accepted.

Scope out:

- code changes;
- frontend layout changes;
- provider configuration changes.

Acceptance criteria:

- Product Apex reflects the new cast and scenario.
- The final line and code remain fixed as documented here.
- The core promise remains voice-first and address-aware.

Validation:

- documentation review against this brief and current product apex.

Status: completed.

### Packet 2: Quest Contract And Backend Routing

Goal: update quest state, actors, transitions, and LLM validation for the new
scenario.

Scope in:

- replace guard/Oleg/Pixel transition names with Dan/Hoover/Fixel transitions;
- remove room and door spoken actors from player-facing replies;
- route unaddressed turns to Sofiia;
- keep Sofiia hint behavior direct-address-only;
- validate Hoover gentle-address gating through LLM decision plus backend
  state gates;
- validate Fixel waking attempts through LLM decision plus backend state gates;
- block Dan code acceptance before badge-code reveal.

Scope out:

- visual redesign;
- new external providers;
- persistent sessions;
- generic scenario engine refactor.

Acceptance criteria:

- backend cannot reveal the code before Fixel is woken;
- backend cannot open the door before Dan receives the revealed code;
- fallback behavior remains safe when the LLM fails;
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`;
- provider-disabled smoke for Ukrainian and English happy paths;
- blocked early-code and early-door smoke cases.

Status: completed.

### Packet 3: Frontend Scenario State Update

Goal: make the room display the new cast and badge reveal states.

Scope in:

- replace guard/Oleg visual role with Dan;
- keep Sofiia visible and make her the likely default speaker;
- show Hoover as the white cat near the door;
- show Fixel as the brown sleeping cat above or near the stage;
- add badge-edge state after Hoover's clue;
- add badge-code reveal state after Fixel wakes;
- remove room/door speaker affordances if present.

Scope out:

- broad art-direction reset;
- dashboards, side panels, visible progress controls, or text input;
- backend provider changes.

Acceptance criteria:

- the new characters are legible in desktop and mobile viewports;
- badge states are visible without turning into an inventory UI;
- the primary screen remains a fullscreen room scene;
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`;
- desktop and mobile screenshot inspection.

Status: ready.

### Packet 4: Voice Mapping And Dialogue Polish

Goal: make spoken and nonverbal audio output match the new cast.

Scope in:

- define actor voice routes for Sofiia, Dan, and Hoover;
- define Fixel as a nonverbal audio actor that can purr or grumble but cannot
  speak words;
- generate or reference local Fixel Sound Effects assets under `public/audio/`
  using ElevenLabs Sound Effects as an asset-production step;
- remove room/door voice usage for scenario replies;
- tune character briefs so Hoover can provide the clue in words while Fixel
  remains asleep/nonverbal;
- smoke test with configured provider when credentials are available.

Scope out:

- changing STT provider architecture;
- new paid-service setup without approval;
- long conversation memory.

Acceptance criteria:

- each speaking actor is distinct by text and by configured voice route when TTS
  is available;
- Fixel produces no worded TTS line; his audible output is only nonverbal cat
  sound, and the badge/code reveal is carried by visual state plus game state;
- runtime uses local Fixel sound-effect assets instead of per-turn ElevenLabs
  Sound Effects generation;
- Hoover and Fixel do not sound interchangeable because Hoover can provide the
  clue in words while Fixel remains asleep/nonverbal;
- provider-disabled fallback still works.

Validation:

- `npm run typecheck`;
- provider-disabled smoke;
- provider-enabled audio smoke when credentials exist.

Status: blocked by Packet 3 visual/state integration.

## Resolved Scenario Decisions

- Product title: **Exit MacPaw Space**.
- Scenario subtitle: **Badge Not Found**.
- Badge code: `404`.
- Final Dan line:
  `Код 404. Двері відчинено. Дякуємо, що були з нами.` /
  `Code 404. Door open. Thanks for being with us.`
- Sofiia may mention Dan early in unaddressed context replies.
- Sofiia must not mention Hoover, Fixel, the badge, or code before the quest
  path reveals those facts.
- Hoover is documented as white from the start.

## Key Risk

Sofiia as default responder can slide into generic chatbot behavior. Keep a hard
distinction between short general context for unaddressed turns and direct hints
only when the player explicitly asks Sofiia for help.
