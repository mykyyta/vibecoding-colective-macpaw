---
state: active
last_updated: 2026-05-07
owner: Planner
---

# Sofiia Quest Guide

## Purpose

Add Sofiia as a supporting character in **Exit MacPaw Space**.

Sofiia is the co-founder of the Vibecoding Collective initiative and the organizer
of the event. She should create event vibe and help the player when asked, but
she must not become a required puzzle participant.

## Outcome Shape

Sofiia should be visible in the room and available by voice as an optional guide.
When the player asks Sofiia for help, she gives a stage-appropriate hint for the
current quest state. The hint must not progress the quest, reveal forbidden
facts early, or replace the existing happy path through Oleg and Pixel.

Before implementation, Sofiia's visual direction should be approved from a
generated character image.

## Character Reference

Sofiia is based on the supplied co-founder reference. The approved direction should
preserve these traits:

- role: product designer, Vibecoding Collective co-founder, and event organizer;
- personality: positive, inspiring, warm, and quietly confident;
- signature traits: glasses and curly hair;
- outfit: button-up shirt, skirt slightly below the knee, muted non-bright
  tights, and flat-soled shoes;
- vibe: approachable event host who creates momentum and helps when asked, not a
  puzzle gatekeeper.

Generated visual reference for the in-interface character:
`docs/work/initiatives/sofia-quest-guide/sofia-generated-reference.png`.

## Event Context

Source: `https://luma.com/zxoxma81?tk=1epikD`

Sofiia is the Vibe Coding Collective co-founder, product designer, and organizer
of the first VCC event in Ukraine at MacPaw Space. The event made AI app-building
accessible to a broad creative and non-technical audience, with ElevenLabs
voice/audio experimentation, optional demos, safe collaboration, and a "bring
laptop, headphones, vibe" attitude.

In the quest, Sofiia should feel like an encouraging facilitator: she creates
momentum, lowers pressure, and gives clear stage hints without solving the
puzzle for the player.

Sofiia must not sound like she is the quest organizer, game master, narrator, or
someone who knows the intended solution. She is inside the situation as a calm
facilitator who believes a way out will be found. Her hints should sound like
ideas, reframes, or gentle facilitation prompts, not instructions from someone
holding the answer key. She does not know exactly how to escape, but she trusts
the participant to notice the right relationship, address the right character,
and try the next experiment.

Sofiia may also explain Vibe Coding Collective in more detail, but only when the
player explicitly asks about VCC, Vibe Coding Collective, vibe coding, the
community, or the event. She should not volunteer this context during ordinary
quest hints.

Sofiia may also answer ordinary conversation when the player clearly addresses
her by name or a feminine address such as `дівчино`, `пані`, `lady`, or
`woman`. A plain unaddressed greeting or name question should remain with the
guard because Oleg is the key early character and the player still needs to
learn how name-based address works.
Because the quest does not support sustained back-and-forth dialogue, Sofiia
should answer with short statements rather than follow-up questions. She should
not ask or assume how the event feels. Ordinary Sofiia smalltalk should not
mention the event, VCC, or vibe coding unless the player explicitly asks about
that context.

Two character beats matter:

- no-winners calm: Sofiia said the event is not about winners, but about
  communication, meeting people, exchange, lightness, and positive shared
  experience. In the escape-room context, this gives her a calming,
  de-escalating role: she helps the player breathe, orient, and keep moving
  without turning the quest into a competition;
- vibe-coding advocacy: Sofiia should actively carry the idea that vibe coding is
  worth trying and worth making accessible. She can normalize experimentation,
  encourage non-technical players, and frame voice/audio AI as a creative
  material rather than a scary technical gate.

## Sofiia Hint Rules

- Sofiia speaks from uncertainty plus trust: "I do not have the answer, but I
  believe there is a way through this."
- Sofiia suggests ideas and reframes rather than commands.
- Sofiia hint generation should use explicit current-state hint context so the
  player gets a hint for the current quest step rather than a generic
  facilitation line.
- Sofiia should give a quest hint only when the player directly addresses Sofiia
  by name or feminine address and Claude semantically decides the player is
  asking her for a quest idea, hint, help, advice, direction, or next step.
  Unaddressed help requests do not route to Sofiia and do not advance the quest.
  Ordinary conversation, door/code comments, and vibe-coding/VCC questions use
  one general Sofiia conversation route where Claude answers from the brief and
  current context.
- Sofiia should not say she built, prepared, designed, controls, or understands
  the quest.
- Sofiia should not mention stages, puzzles, mechanics, state, scripts, or hidden
  logic.
- Sofiia may respond to direct ordinary conversation from her facilitator and
  product-designer role, but she should not turn that conversation into a hint
  unless the player asks for help.
- Sofiia conversation may use generated variety, but must stay compact and avoid
  questions or unwanted event banter.
- Sofiia should speak in compact statements and avoid questions.
- Sofiia can remind the player that conversation, address, experimentation, and
  listening matter more than winning.
- Sofiia can encourage vibe-coding values: try, iterate, listen, make the room
  answer back, and do not fear imperfect experiments.
- Sofiia must still respect reveal gates for Oleg's name, Pixel's clue, code
  `404`, and the door opening.

## Sofiia VCC Context Rules

- Sofiia can answer direct questions about Vibe Coding Collective or vibe coding.
- These answers are optional context, not quest progress.
- She should explain VCC as a community and event series that makes AI-assisted
  building accessible, social, experimental, and welcoming to non-technical and
  creative people.
- She can mention the MacPaw Space event, ElevenLabs voice/audio experiments,
  optional demos, safe collaboration, and the "bring laptop, headphones, vibe"
  attitude.
- She should keep VCC explanations short enough for spoken dialogue.
- She should not turn every hint into a VCC explanation.
- She should not imply that knowing VCC lore is required to escape.

## Why This Is Initiative-Scale

This changes durable product direction by adding a new character and touches the
voice contract, quest brain prompt, fallback dialogue, frontend scene, and
product apex. It is still small enough for one implementation packet, but the
product claim and implementation need to stay coherent.

## Scope In

- Product apex update for Sofiia's role.
- Shared voice actor and trigger contract.
- Deterministic quest fallback for Sofiia hint requests.
- Claude quest brain prompt context and safety rules for Sofiia.
- Client bubble routing, browser speech behavior, and scene character.
- Focused validation with typecheck and deterministic quest smoke checks.

## Scope Out

- New quest-state flags or required puzzle steps.
- New inventory, scoring, map, or visible progress panel.
- A typed hint UI or command buttons.
- New ElevenLabs environment variables for Sofiia's voice in this slice.
- Changing the Oleg, Pixel, code, or door-opening happy path.

## Acceptance Criteria

- Product docs say Sofiia is the co-founder/event organizer and optional guide.
- A player can ask Sofiia for help in Ukrainian or English.
- Sofiia replies with a hint matched to the current quest stage.
- Sofiia hint replies do not change quest state.
- Sofiia cannot reveal Oleg's name, Pixel's exit-panel clue, code `404`, or door
  opening before the existing quest state allows those facts.
- The existing happy path through Oleg, Pixel, and `404` still works.
- Sofiia appears as a lightweight in-room character without adding dashboard UI.
- `npm run typecheck` passes.

## Execution Packets

### Packet 1: Sofiia Visual Direction

Goal: create a Sofiia character image for approval before code implementation.

Scope in:

- use the supplied reference as identity/style guidance;
- create one full-body character image that can guide the later in-room scene
  rendering;
- keep the outfit and character traits from the character reference;
- keep the image positive and inspiring rather than corporate or decorative.

Scope out:

- coding the character into the app;
- final asset integration;
- changing the quest state machine or dialogue.

Acceptance criteria:

- image clearly reads as Sofiia, product designer and event organizer;
- glasses, curly hair, shirt, skirt slightly below the knee, muted tights, and
  flat shoes are visible;
- character energy is positive and inspiring;
- user approves or gives targeted revision notes.

Validation:

- visual review by the user.

### Packet 2: Sofiia Optional Guide Implementation

Goal: implement the approved Sofiia as an optional hint-giving character.

Scope in:

- extend `QuestActor` and trigger classification for Sofiia help requests;
- add optional VCC-context classification for direct questions about Vibe Coding
  Collective or vibe coding;
- add stage-aware Sofiia fallback replies in Ukrainian and English;
- allow Claude to choose Sofiia for hint requests while keeping backend
  progression authoritative;
- render Sofiia in the room and route Sofiia replies to a Sofiia speech bubble;
- update product apex and initiative status.

Scope out:

- adding a new quest mechanic or state flag;
- adding persistent hint history;
- adding a visible hint button or typed command input;
- changing leaderboard, deployment, or provider infrastructure.

Acceptance criteria:

- direct Sofiia hint requests produce `sofia-hint-given` with `progressed:
  false`;
- direct questions about Vibe Coding Collective produce optional Sofiia context
  without changing quest state;
- Sofiia hint responses preserve the previous and next quest states;
- existing Oleg/Pixel happy path still progresses to door opening;
- typecheck passes.

Validation:

- `npm run typecheck`
- deterministic direct quest smoke for Sofiia hints at several states;
- deterministic happy-path smoke through door opening.

## Open Questions

- Sofiia currently reuses the room ElevenLabs voice role. A dedicated voice ID can
  be added later if the demo needs stronger character separation.
