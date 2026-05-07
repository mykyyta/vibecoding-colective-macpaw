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
| Claude-First Quest Brain | Unassigned | Ready | New packet: Claude proposes the quest transition and varied reply first; backend validates against allowed transitions and falls back to deterministic logic on unavailable, invalid, illegal, or unsafe output. |
| Distinct ElevenLabs Character Voices | Codex | Completed | Added actor-specific ElevenLabs voice mapping for guard, Pixel, and room/door, with Pixel replies shaped as lazy male-cat first-person speech. |

## Current Decisions

- Split visual and backend work into separate packets.
- The first visual pass with mock controls is no longer the target primary UI.
- The current target is one fullscreen quest room with strong MacPaw Space reference fidelity.
- Player interaction in the primary experience must be voice-only.
- Current visual pass is desktop-focused; mobile is not a requirement.
- Quest progression is pivoting from deterministic-parser-first to Claude-first. Claude may select one backend-provided allowed transition and write a varied reply.
- Backend remains the authority for legal progression: it derives allowed transitions from current state, validates Claude output, computes next state server-side, blocks early `404` or door/escape claims, and uses deterministic parser/state machine fallback on any Claude failure.
- Existing ElevenLabs STT/TTS behavior should remain unchanged by the Claude-first packet unless a minimal response-contract adjustment is required.
- ElevenLabs TTS voice roles are `guard`, `pixel`, `sofia`, and `room`; `door` and `system` actors use the room voice.
- Actor-specific ElevenLabs voice IDs are code constants in `src/server/providers/config.ts`, not environment variables.
- The local room voice is set with the room voice ID constant.
- Pixel is a male cat; the local Pixel voice is set with the Pixel voice ID constant.
- Pixel TTS uses slower, slightly stylized per-request voice settings so he reads as lazy and smug, not energetic or adult-masculine.
- Pixel replies should sound like Pixel speaking as a cat, not room narration describing Pixel.
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

Choose concrete ElevenLabs voice IDs for Oleg, Pixel, and the room in `.env`, then run a provider-enabled audio smoke. Packet 4, **Claude-First Quest Brain**, remains ready for Executor if Claude-first progression is still the next priority.

First packet handoff:

- Goal: make Claude the primary quest brain for `/api/voice-turn`.
- Scope in: strict Claude JSON contract, scenario and allowed-transition prompt payload, backend output validation, server-side transition application, deterministic fallback, and targeted smoke validation.
- Scope out: frontend redesign, deployment work, ElevenLabs STT/TTS changes, persistent sessions, and broad quest refactors.
- Acceptance: Claude is tried first when configured; valid Claude output can progress only through allowed transitions; `404` and door opening remain gated by backend state; deterministic fallback still completes the quest; `npm run typecheck` passes.
- Validation: `npm run typecheck`; provider-disabled fallback smoke; provider-enabled Claude smoke when credentials exist; blocked early-code and early-door cases; full happy path.

## Risks

- Visual polish can expand quickly; keep the first slice to one room and simple architectural animations.
- Removing visible fallback controls means local testing needs either browser speech recognition or a dev-only path that does not appear in the main UI.
- Browser speech recognition remains browser-dependent, and the first mic activation still requires the browser permission flow.
- Purr detection may start as transcript-marker detection unless real audio-level detection becomes available in time.
- Claude may be creative in ways that break the puzzle if unconstrained; backend validation must reject illegal transitions, early `404`, and premature door/escape claims before returning the reply.
- ElevenLabs realtime STT may transcribe purring unpredictably; keep browser speech fallback and marker tuning available for the event slice.
- Existing local worktree contains unrelated provider/readiness changes; packet owners must avoid reverting them.

## Planned Smoke Cases

- Start state + `відкрий двері` returns no progress and does not reveal Oleg, Pixel clue, `404`, or door opening.
- Start state + `як тебе звати` may progress to Oleg name learned.
- Oleg known + `Олег відкрий двері` may progress to guard hint and Pixel exit-panel clue, but must not reveal `404`.
- Guard hint given + `Pixel відкрий двері` may address Pixel and reject ordinary command, but must not reveal `404`.
- Pixel addressed + `Pixel мур мур` may reveal `404`.
- Code not revealed + `Олег код 404` must not open the door.
- Code revealed + `Олег код 404` may open the door and mark escape.

## Latest Validation

- `npm run typecheck` passed after adding actor-specific ElevenLabs TTS voice mapping.
- Provider-disabled API smoke on `SERVER_PORT=8799` returned distinct actors for guard, Pixel, room/system, and door turns; Pixel fallback reply is first-person catlike speech and all turns fell back cleanly to browser speech when ElevenLabs was absent.
- `npm run typecheck` passed after merging backend, frontend, dialogue, and STT bridge work.
- Earlier full-stack validation used `http://localhost:3000/` with API on `http://localhost:8787`; those processes are not kept running by the distinct-voices packet.
- Earlier `GET /api/status` reported Claude configured and ElevenLabs not configured in that validation environment.
- Earlier `GET /api/stt/capability` returned fail-closed fallback because `ELEVENLABS_API_KEY` was not configured.
- Earlier `POST /api/voice-turn` with `як тебе звати` returned `oleg-name-learned`, Oleg's reply, and browser-speech fallback audio error.
