---
state: active
last_updated: 2026-05-07
owner: Orchestrator
---

# Sofiia Quest Guide Status

## Summary

Initiative added Sofiia as a visible, optional supporting character who gives
stage-safe facilitation ideas and Vibe Coding Collective context without
changing the required quest path.

## Packet Status

| Packet | Owner | Status | Notes |
| --- | --- | --- | --- |
| Sofiia Visual Direction | Executor | Accepted | CSS-drawn Sofiia visual direction accepted for now: detached longer side curls, open face, symmetric glasses lenses, thinner feminine torso, long dark shirt sleeves with visible hands, and a below-knee skirt. |
| Sofiia Optional Guide Implementation | Codex | Completed | Added Sofiia as a non-progress voice actor with hint and VCC-context intents, stage-safe fallback replies, Claude prompt guardrails, Sofiia speech bubble routing, product docs, typecheck, smoke checks, and desktop/mobile screenshots. |

## Current Decisions

- Sofiia is the Vibecoding Collective co-founder and event organizer.
- Sofiia creates vibe and gives hints only when asked.
- Sofiia does not advance quest state and is not required for the happy path.
- Sofiia is a product designer with glasses, curly hair, a button-up shirt, a
  skirt slightly below the knee, muted tights, and flat-soled shoes.
- Sofiia's character tone is positive, inspiring, warm, and quietly confident.
- Sofiia's quest role is an encouraging facilitator who lowers pressure, creates
  momentum, and gives clear hints without solving the puzzle.
- Sofiia is not the quest organizer or a game master. She should not sound like
  she knows the intended solution. She believes a way out will be found, offers
  ideas and reframes, and trusts the participant to discover the escape.
- Sofiia may explain Vibe Coding Collective or vibe coding in more detail only
  when the player explicitly asks about VCC, the community, vibe coding, or the
  event. She should not volunteer VCC exposition during ordinary hints.
- Sofiia may answer ordinary conversation only when the player clearly addresses
  her by name or a feminine address such as `дівчино`, `пані`, `lady`, or
  `woman`; unaddressed greetings and name questions should stay with the guard.
- Sofiia should answer with short statements and avoid follow-up questions,
  especially questions about the event, because the quest does not support a
  sustained dialogue loop.
- Sofiia conversation should not use recap jokes about the event being enjoyable
  or getting stuck in the door.
- Sofiia conversation may use Claude-generated variety, with guardrails against
  questions and event recap.
- Sofiia hint generation uses explicit current-state hint context so Claude has
  to point to the player's current quest step instead of generic facilitation.
- Sofiia hint routing requires a Sofiia name/feminine address, then Claude
  semantically decides whether the turn asks Sofiia for a quest idea, hint, help,
  advice, direction, or next step. Unaddressed help requests do not route to
  Sofiia and do not advance the quest. Ordinary Sofiia conversation, door/code
  comments, and VCC/vibe-coding questions route to the general Sofiia
  conversation route.
- Sofiia should carry the event's no-winners attitude: the point is
  communication, meeting people, exchange, lightness, and positive shared
  experience rather than competition.
- Sofiia should advocate for vibe coding as accessible creative practice,
  especially for broad and non-technical audiences.
- Sofiia must respect existing reveal gates for Oleg, Pixel, code `404`, and the
  door opening.
- Sofiia uses a dedicated ElevenLabs voice ID constant.
- Generated reference is stored at
  `docs/work/initiatives/sofia-quest-guide/sofia-generated-reference.png`.

## Next Action

Run a live microphone demo and tune Sofiia's spoken wording if the generated or
fallback replies feel too directive, too expository, or not calm enough.

## Latest Validation

- `npm run typecheck` passed.
- Deterministic smoke check passed for:
  - Sofiia initial hint as `sofia-hint-given` with unchanged quest state;
  - Sofiia VCC question as `sofia-conversation-replied` with unchanged quest
    state;
  - Sofiia post-Oleg hint with unchanged quest state;
  - Sofiia direct conversation as `sofia-conversation-replied` when addressed by
    name or a feminine address;
  - Sofiia conversation using generated varied compact copy with guardrails;
  - Sofiia hint transition cards including state-specific context for each quest
    step;
  - generated Sofiia replies with questions rejected into deterministic fallback;
  - generated Sofiia event-recap jokes rejected into deterministic fallback;
  - generic `привіт` and `як тебе звати` still going to the guard path;
  - existing happy path through generic door command, Oleg name, guard hint,
    Pixel rejection, Pixel purr, `404`, and door opening.
- Desktop screenshot checked at `1440x900`, latest review image:
  `/tmp/sofia-desktop-v18.png`.
- Mobile screenshot checked at `390x844`, latest review image:
  `/tmp/sofia-mobile-v18.png`.

## Risks

- The extra visible character can clutter mobile composition if placed too close
  to Oleg, Pixel, the door, or the mic.
- Claude may be tempted to over-help. Backend validation and deterministic hint
  copy must keep forbidden facts gated.
