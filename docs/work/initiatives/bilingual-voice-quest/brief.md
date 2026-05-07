---
state: active
last_updated: 2026-05-07
owner: Planner
---

# Bilingual Voice Quest

## Purpose

Make **Exit MacPaw Space** playable in both Ukrainian and English while keeping
voice as the only intended player input.

The player should not choose a language from visible controls. The system should
infer the player's language from each spoken turn, answer in the appropriate
language, and keep the same quest state regardless of whether the player speaks
Ukrainian or English.

## Outcome Shape

The quest remains one fullscreen voice-operated room. A player can complete the
same happy path in Ukrainian, English, or with natural switching between the two
languages across turns:

- Ukrainian turn in, Ukrainian reply out;
- English turn in, English reply out;
- short ambiguous turns such as `Pixel`, `404`, `meow`, or `mrr` do not cause
  unstable language switching;
- the core puzzle transitions work in either language;
- Oleg, Pixel, and the room/door keep their character voices and scenario
  constraints.

Language detection should happen per voice turn, not once per quest session.
The system may keep a sticky previous language only when the current turn is too
short or confidence is too low to classify safely.

## Research Summary

This is feasible with the current stack, but it requires a small language
contract across STT, quest classification, quest brain prompts, TTS, and UI
copy.

Relevant provider findings:

- ElevenLabs Scribe v2 supports 90+ languages, including Ukrainian and English,
  and includes smart language detection.
- Batch STT responses include `language_code` and `language_probability`.
- Realtime STT committed transcript events can include `language_code`.
- The current app already has ElevenLabs STT/TTS server boundaries, but it pins
  STT to Ukrainian and makes Claude produce Ukrainian replies.

References:

- https://elevenlabs.io/docs/overview/capabilities/speech-to-text
- https://elevenlabs.io/docs/api-reference/speech-to-text/convert?explorer=true
- https://elevenlabs.io/docs/api-reference/speech-to-text/v-1-speech-to-text-realtime

## Why This Is Initiative-Scale

This needs multiple ordered packets because it changes both product behavior and
technical contracts:

- product language promise must be accepted and recorded;
- shared voice-turn request and response shapes need language metadata;
- ElevenLabs recorded and realtime STT need to stop forcing Ukrainian when
  auto-detection is enabled;
- browser speech fallback needs a realistic strategy because browser STT does
  not reliably auto-detect language across browsers;
- quest classification must support Ukrainian and English trigger phrases;
- Claude quest brain must reply in the selected language without violating
  puzzle constraints;
- UI copy and visual QA must handle both languages without visible language
  controls or text clipping.

## Scope In

- Per-turn language detection for player voice turns.
- Supported reply languages: Ukrainian and English.
- Shared language metadata in voice contracts.
- Recorded ElevenLabs STT language detection.
- Realtime ElevenLabs STT language metadata handling where available.
- Browser speech fallback strategy for Ukrainian and English.
- Bilingual deterministic transcript classifier.
- Bilingual Claude quest brain prompt and reply validation.
- Bilingual fallback replies for all quest transitions.
- Minimal UI copy adaptation for mic hints, transcript states, and error text.
- Desktop and mobile validation for Ukrainian and English happy paths.

## Scope Out

- Manual language selector in the main quest UI.
- Additional languages beyond Ukrainian and English.
- Translating the whole product into a general localization platform.
- New quest mechanics, characters, inventory, or puzzle chain.
- Replacing ElevenLabs with a different provider.
- Storing raw transcripts for language analytics.
- Native mobile app packaging.

## Acceptance Criteria

- A player can complete the full quest happy path in Ukrainian.
- A player can complete the full quest happy path in English.
- A player can switch languages between turns and still progress through the
  same quest state.
- Each server voice-turn response includes the transcript language decision used
  by the quest brain.
- Low-confidence or ambiguous short turns do not flip the reply language
  unexpectedly.
- The deterministic fallback works for the core Ukrainian and English trigger
  phrases without Claude.
- Claude-generated replies obey the selected reply language and all existing
  puzzle constraints.
- ElevenLabs TTS receives text in the selected reply language without exposing
  secrets to the browser.
- Browser speech fallback is documented with its limitations and does not make a
  false product promise.
- Main quest UI remains voice-only and does not add language buttons, typed
  input, or dashboard panels.
- `npm run typecheck` passes.

## Packets

### Packet 1: Product And Language Contract

Goal: Record the accepted bilingual product promise and define the smallest
language contract for execution.

Scope in:

- update `docs/product/product.md` if bilingual play is accepted as durable
  product direction;
- define `QuestLanguage`, detected language fields, confidence handling, and
  sticky fallback rules in the relevant technical doc or shared contract plan;
- decide how ambiguous turns behave;
- document provider and browser fallback limitations.

Scope out:

- implementation changes;
- UI redesign;
- adding manual language controls.

Files or areas likely touched:

- `docs/product/product.md`
- `docs/build-system/architecture/stack.md`
- `src/shared/voice.ts`

Acceptance criteria:

- Product docs say the quest can be completed in Ukrainian and English.
- Technical direction defines per-turn language detection and fallback behavior.
- The first implementation packet has a concrete contract to build against.

Validation:

- documentation review;
- `npm run typecheck` only if shared TypeScript types are changed.

Status: ready.

### Packet 2: STT Language Metadata

Goal: Capture language detection from ElevenLabs STT and pass it through to the
voice turn route.

Scope in:

- recorded STT no longer forces Ukrainian when auto-detection is desired;
- recorded STT response includes language code and probability when provider
  returns them;
- realtime STT committed transcript handling preserves provider language code
  when available;
- client sends language metadata with `/api/voice-turn`;
- current Ukrainian-only behavior remains available as fallback if provider
  metadata is missing.

Scope out:

- quest classification changes beyond passing metadata;
- new providers.

Files or areas likely touched:

- `src/shared/voice.ts`
- `src/server/providers/elevenlabs.ts`
- `src/server/index.ts`
- `src/client/App.tsx`

Acceptance criteria:

- recorded STT returns text plus language metadata where available;
- realtime committed transcripts can carry language metadata to the server;
- missing metadata degrades predictably.

Validation:

- `npm run typecheck`;
- mocked STT response tests or smoke scripts for Ukrainian and English payloads.

Status: pending Packet 1.

### Packet 3: Language-Aware Quest Brain

Goal: Make quest classification and generated replies work in Ukrainian and
English.

Scope in:

- add bilingual trigger phrases for guard name, Oleg-directed door command,
  Pixel address, purr, code 404, smalltalk, and generic door commands;
- infer reply language from STT metadata, transcript heuristics, and sticky
  session language rules;
- update Claude prompt to produce replies in the selected language;
- add English fallback replies for all legal transitions;
- keep existing guard, Pixel, code reveal, and door-opening constraints.

Scope out:

- changing quest state shape beyond language metadata;
- changing puzzle order;
- adding manual language choice.

Files or areas likely touched:

- `src/server/quest.ts`
- `src/server/quest-brain.ts`
- `src/server/dialogue.ts`
- `src/shared/voice.ts`

Acceptance criteria:

- deterministic fallback completes the Ukrainian happy path;
- deterministic fallback completes the English happy path;
- mixed-language turns preserve state and reply language policy;
- Claude cannot reveal Oleg, Pixel, code 404, or door opening early in either
  language.

Validation:

- `npm run typecheck`;
- targeted server smoke checks against `/api/voice-turn` for Ukrainian,
  English, mixed-language, and premature-code cases.

Status: pending Packet 2.

### Packet 4: Bilingual UI Copy And Fallback Behavior

Goal: Make visible voice-status copy and browser fallback behavior coherent for
both languages without adding language controls.

Scope in:

- language-aware mic prompt, retry, busy, unavailable, and transcript messages;
- browser speech fallback strategy for `uk-UA` and `en-US`;
- mobile and desktop text-fit checks for English and Ukrainian strings;
- documented limitations when browser STT cannot auto-detect language.

Scope out:

- landing page or dashboard localization;
- language selector;
- major room layout redesign.

Files or areas likely touched:

- `src/client/App.tsx`
- `src/client/styles.css`
- `docs/build-system/frontend/design-direction.md` only if UI direction changes.

Acceptance criteria:

- status/error copy follows the current reply language or safe fallback language;
- UI text fits on desktop and mobile;
- main quest screen stays room-first and voice-only.

Validation:

- `npm run typecheck`;
- desktop and mobile visual checks for Ukrainian and English states.

Status: pending Packet 3.

### Packet 5: End-To-End Bilingual QA

Goal: Verify that the integrated bilingual quest works as a playable product.

Scope in:

- run local app;
- complete the happy path in Ukrainian;
- complete the happy path in English;
- complete a mixed-language path with language switching between turns;
- verify ElevenLabs configured path when credentials are available;
- verify browser fallback path with documented limitations.

Scope out:

- broad redesign;
- new gameplay;
- production deployment unless already needed by an active release packet.

Files or areas likely touched:

- `docs/work/initiatives/bilingual-voice-quest/status.md`
- small bug fixes only if QA exposes narrowly scoped defects.

Acceptance criteria:

- all acceptance criteria for the initiative are checked or explicitly marked as
  blocked;
- remaining provider/browser limitations are documented;
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`;
- local browser smoke on desktop and mobile viewports;
- provider-enabled smoke only when local credentials are available.

Status: pending Packets 1-4.

## First Execution Unit

Start with Packet 1, **Product And Language Contract**.

This packet should settle the durable product promise and technical language
fields before implementation begins. It prevents the later packets from
guessing whether language is a session setting, a per-turn decision, or a UI
choice.

## Owner And Mode

- Planning owner: Planner.
- Product review: Strategist for the bilingual product promise.
- Technical review: Architect for the language contract and provider boundary.
- Execution mode: sequential packets, with QA after integration.

## Open Questions

- Should English replies preserve Ukrainian event terms such as
  `вайбкодінг івент`, or translate them as `vibe-coding event`?
- Should Oleg's final line remain exactly `404 accepted. Door not found, but
  exit found.` in Ukrainian play, or should Ukrainian play receive a Ukrainian
  equivalent before the final English joke?
- What confidence threshold is acceptable before switching reply language on a
  short turn?
- Should browser fallback prefer the last successful language or run a two-pass
  attempt when ElevenLabs STT is unavailable?
