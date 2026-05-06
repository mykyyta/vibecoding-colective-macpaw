---
state: active
last_updated: 2026-05-06
owner: Orchestrator
---

# Exit MacPaw Space Voice Quest Status

## Summary

Initiative created to coordinate the visual frontend and backend voice work for **Exit MacPaw Space**.

## Packet Status

| Packet | Owner | Status | Notes |
| --- | --- | --- | --- |
| Visual Quest Room | Visual frontend agent | Completed | Laplace implemented the visual-only room in `src/client/App.tsx` and `src/client/styles.css`; `npm run typecheck` passed; desktop/mobile screenshots and mock-flow smoke test passed. |
| Fullscreen Voice-Only Scene Redesign | Frontend redesign agent | Completed | Ptolemy rebuilt the visible UI as one desktop-focused fullscreen MacPaw Space-like scene; removed buttons, typed input, panels, logs, and dashboard UI; `npm run typecheck` passed; desktop screenshot inspected; mobile polish skipped by scope. |
| Quest Logic Contract | Pascal | Completed | Implemented deterministic quest state machine, transcript trigger classifier, shared response contract, and `/api/voice-turn` state payload. |
| Backend Dialogue And Audio Response | Bohr | Completed | Added Claude guarded reply generation after deterministic transition, fallback replies, and existing optional ElevenLabs TTS for approved replies. |
| ElevenLabs Realtime STT Bridge | Laplace | Completed | Added fail-closed ElevenLabs realtime STT session/capability endpoints and client fallback to browser speech recognition. |
| Frontend/Backend Integration | Newton | Completed | Connected browser speech transcripts to `/api/voice-turn`, maps backend quest state to visual room state, and plays ElevenLabs audio or browser speech fallback. |

## Current Decisions

- Split visual and backend work into separate packets.
- The first visual pass with mock controls is no longer the target primary UI.
- The current target is one fullscreen quest room with strong MacPaw Space reference fidelity.
- Player interaction in the primary experience must be voice-only.
- Current visual pass is desktop-focused; mobile is not a requirement.
- Quest progression belongs to a deterministic backend state machine. Claude can write in-state replies but must not decide progression, reveal `404`, or open the door.
- Backend packet should provide transcript-to-quest-event behavior, Claude/fallback dialogue, optional ElevenLabs TTS, and later ElevenLabs realtime STT.
- The first demo stays one room, two characters, one code, and one exit.
- Scenario V2 is fixed as **404 Door Not Found**: the user must learn the guard's name, address Oleg by name, address Pixel directly, and gently purr before Pixel reveals code `404`.

## Active Constraints

- Do not add complex game engine infrastructure for the first slice.
- Do not require ElevenLabs credentials for the visual demo to work.
- Keep backend secrets and provider calls server-side.
- Keep the first screen as the playable room.
- Do not expose visible mock command buttons or manual text input in the main quest experience.
- Do not use side panels, progress dashboards, readiness boards, or dialogue logs on the primary game screen.
- Keep any mic/listening indicator minimal and integrated into the room.
- Do not spend current-pass time on mobile-specific layout or polish.

## Next Action

Run live browser microphone testing on `http://localhost:3000/`. If ElevenLabs credentials are added to `.env`, verify realtime STT session creation, purr transcription, and TTS playback.

## Risks

- Visual polish can expand quickly; keep the first slice to one room and simple architectural animations.
- Removing visible fallback controls means local testing needs either browser speech recognition or a dev-only path that does not appear in the main UI.
- Browser speech recognition remains browser-dependent, and the first mic activation still requires the browser permission flow.
- Purr detection may start as transcript-marker detection unless real audio-level detection becomes available in time.
- Claude may be creative in ways that break the puzzle if unconstrained; backend state must decide all reveals and door opening before Claude writes a reply.
- ElevenLabs realtime STT may transcribe purring unpredictably; keep browser speech fallback and marker tuning available for the event slice.
- Existing local worktree contains unrelated provider/readiness changes; packet owners must avoid reverting them.

## Latest Validation

- `npm run typecheck` passed after merging backend, frontend, dialogue, and STT bridge work.
- Dev stack is running at `http://localhost:3000/` with API on `http://localhost:8787`.
- `GET /api/status` reports Claude configured and ElevenLabs not configured in the current `.env`.
- `GET /api/stt/capability` returns fail-closed fallback because `ELEVENLABS_API_KEY` is not configured.
- `POST /api/voice-turn` with `як тебе звати` returns `oleg-name-learned`, Oleg's reply, and browser-speech fallback audio error.
