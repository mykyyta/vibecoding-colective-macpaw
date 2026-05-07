---
state: active
last_updated: 2026-05-07
owner: Orchestrator
---

# Bilingual Voice Quest Status

## Summary

Initiative opened to make **Exit MacPaw Space** playable in Ukrainian and
English with per-turn language detection and no visible language selector in the
main quest UI.

## Packet Status

| Packet | Owner | Status | Notes |
| --- | --- | --- | --- |
| Product And Language Contract | Codex | Completed | Product promise, language metadata shape, confidence rules, and browser fallback posture are recorded. |
| STT Language Metadata | Codex Worker | Completed | Recorded/realtime/browser paths now pass language metadata toward `/api/voice-turn`; ElevenLabs STT no longer forces Ukrainian. |
| Language-Aware Quest Brain | Codex Worker | Completed | Bilingual deterministic replies, English trigger coverage, language decision policy, and language-aware Claude prompts are integrated into `/api/voice-turn`. |
| Bilingual UI Copy And Fallback Behavior | Codex Worker | Completed | UI copy is language-aware, browser fallback uses sticky `uk-UA`/`en-US`, and the main screen remains voice-only. |
| End-To-End Bilingual QA | Codex | Completed | Verified typecheck/build, API bilingual progression, and desktop/mobile screenshots. |

## Current Decisions

- This is Initiative-scale because it changes product behavior, shared voice
  contracts, provider integration behavior, quest brain prompting, fallback
  replies, and UI copy.
- Language should be detected per voice turn.
- The system may use sticky previous language only for ambiguous or
  low-confidence turns.
- The main quest UI must not add language buttons, typed input, or dashboard
  controls.
- Raw transcripts should not be stored for language analytics as part of this
  initiative.

## Active Constraints

- Keep the app runnable with `npm run dev`.
- Keep all provider secrets server-side.
- Preserve the current voice-only room-first product promise.
- Do not change unrelated current work in `src/client` or `src/server`.
- Validate with the smallest meaningful checks, starting with
  `npm run typecheck`.
- Provider-enabled ElevenLabs checks should run only when local credentials are
  available and the user accepts the paid-provider cost.

## Next Action

Initiative implementation is ready for review.

Review handoff:

- Product, technical contract, STT metadata, quest brain, UI copy, and QA
  packets are complete.
- Review the diff in branch `work/bilingual-voice-quest`.
- Real ElevenLabs microphone/STT/TTS validation remains optional and requires
  local credentials plus acceptance of paid provider use.

## Risks

- Browser speech recognition fallback may not reliably auto-detect Ukrainian
  and English per turn, so the product should treat ElevenLabs STT as the
  primary bilingual path.
- Short turns such as `Pixel`, `404`, `meow`, or `mrr` can be language-ambiguous
  and need sticky fallback behavior.
- English trigger phrases may accidentally make early code or Pixel-name reveals
  easier unless backend validation stays authoritative.
- Ukrainian and English UI strings have different lengths; mobile text-fit
  checks are needed.
- Realtime and recorded STT may expose language metadata differently, so shared
  contracts should allow optional provider metadata.

## Latest Validation

- Packet 5:
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - Local dev stack ran with client at `http://localhost:3200/` and API at
    `http://localhost:8898`.
  - API smoke passed for Ukrainian happy path, English happy path,
    mixed-language progression, sticky ambiguous `Pixel`, exact final door line,
    and no early Pixel/code reveal.
  - Chrome headless screenshots captured for desktop `1440x900` and mobile
    `390x844` to `/tmp/bilingual-voice-quest-qa/`; idle layout remained
    room-first and mic text fit.
- Packet 4:
  - Added Ukrainian/English UI copy for mic states, retry/error/unavailable
    messages, transcript speaker labels, ambient hints, restart label, and
    browser speech fallback language.
  - Browser speech fallback now selects `uk-UA` or `en-US` from the previous
    reliable language decision, defaulting to Ukrainian.
  - Worker validation: `npm run typecheck`, `git diff --check -- src/client/App.tsx src/client/styles.css`,
    and grep checks passed.
- Packet 3:
  - Added bilingual deterministic replies and English trigger coverage for the
    current quest transitions.
  - Added `decideQuestLanguage` with provider, heuristic, sticky, and default
    language handling.
  - Wired `/api/voice-turn` to return the real language decision and call the
    quest brain with the selected reply language.
  - Fixed an integration regression so Pixel is not named before Oleg gives the
    Pixel clue.
  - `npm run typecheck` passed.
  - Targeted `npx tsx` smoke passed for Ukrainian happy path, English happy path,
    exact final door line, no early Pixel/code reveal, and sticky ambiguous
    language behavior.
- Packet 2:
  - Removed forced Ukrainian `language_code` from ElevenLabs recorded and
    realtime STT setup.
  - Recorded STT maps ElevenLabs `language_code` and `language_probability` into
    shared language metadata.
  - Realtime STT committed transcripts can carry top-level provider language
    metadata to `/api/voice-turn`.
  - Browser speech fallback sends its configured recognition language as
    low-ambition metadata; it does not claim auto-detection.
  - Worker validation: `npm run typecheck` passed, and a mocked recorded STT
    check verified English metadata mapping without real provider calls.
- Packet 1:
  - Updated product apex with Ukrainian/English voice-play promise and no visible
    language selector.
  - Added the Voice Language Contract to `docs/build-system/architecture/stack.md`.
  - Added shared language types in `src/shared/voice.ts`.
  - Added a temporary default `languageDecision` in `/api/voice-turn` responses
    so the shared contract remains type-safe until Packet 2/3 replace it with
    real language selection.
  - `npm run typecheck` passed.
