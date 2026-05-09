---
state: active
last_updated: 2026-05-09
owner: Orchestrator
---

# Exit MacPaw Space Voice Quest Status

## Summary

Initiative created to coordinate the first visual frontend and backend voice
work for **Exit MacPaw Space**.

The original Oleg/Pixel scenario is superseded by
`docs/work/initiatives/organizers-cat-badge-scenario/`. Current canonical
product direction is **Exit MacPaw Space: Badge Not Found** with Sofiia, Dan,
Hoover, and Fixel.

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
| Distinct ElevenLabs Character Voices | Codex | Superseded | Original Oleg/Pixel/room voice mapping has been replaced by Dan/Hoover/Sofiia TTS plus Fixel nonverbal SFX in the organizers-cat-badge scenario. |

## Current Decisions

- Split visual and backend work into separate packets.
- The first visual pass with mock controls is no longer the target primary UI.
- The current target is one fullscreen quest room with strong MacPaw Space reference fidelity.
- Player interaction in the primary experience must be voice-only.
- Current visual pass is desktop-focused; mobile is not a requirement.
- Quest progression uses a Claude-first brain with backend validation. Claude may
  select one backend-provided allowed transition and write a varied reply.
- Backend remains the authority for legal progression: it derives allowed
  transitions from current state, validates Claude output, computes next state
  server-side, blocks early `404` or door/escape claims, and uses deterministic
  parser/state machine fallback on any Claude failure.
- Current ElevenLabs TTS voice roles are `dan`, `hoover`, and `sofia`.
- There is no guard, room voice, or door voice in the current scenario.
- Fixel is nonverbal and uses local Sound Effects assets rather than TTS.
- Actor-specific ElevenLabs voice IDs are code constants in
  `src/server/providers/config.ts`, not environment variables.
- The current scenario is **Badge Not Found**: ask Dan to inspect the locked
  door, address Hoover gently to learn about Fixel and the badge, wake Fixel to
  reveal code `404`, then tell Dan the code.

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

Continue the active organizers-cat-badge scenario. The immediate remaining work
is generating and listening to the Fixel Sound Effects assets before production
deployment.

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
- Nonverbal cat-sound detection may start as transcript-marker detection unless
  real audio-level detection becomes available in time.
- Claude may be creative in ways that break the puzzle if unconstrained; backend validation must reject illegal transitions, early `404`, and premature door/escape claims before returning the reply.
- ElevenLabs realtime STT may transcribe purring unpredictably; keep browser speech fallback and marker tuning available for the event slice.
- Existing local worktree contains unrelated provider/readiness changes; packet owners must avoid reverting them.

## Planned Smoke Cases

- Start state + unaddressed question returns Sofiia context and does not reveal
  Hoover, Fixel, badge, code, or door opening.
- Start state + `Dan перевір двері` may progress to `dan-door-checked` and
  should point toward Hoover.
- Dan checked + ordinary Hoover command may reject without revealing Fixel.
- Dan checked + gentle Hoover address may progress to `hoover-clue-given` and
  reveal the badge edge.
- Hoover clue given + direct Fixel without a wake attempt stays nonverbal and
  does not reveal `404`.
- Hoover clue given + plausible Fixel wake attempt may progress to
  `code-revealed` and reveal `404` visually.
- Code not revealed + `Dan код 404` must not open the door.
- Code revealed + `Dan код 404` opens the door with the accepted Dan final
  line.

## Latest Validation

- `npm run typecheck` passed after the Badge Not Found scenario update.
- `npm run test:quest` passed for the organizers-cat-badge scenario.
- Provider-disabled mode remains playable; Fixel SFX assets fall back gracefully
  when files are missing.
- `npm run typecheck` passed after merging backend, frontend, dialogue, and STT bridge work.
- Earlier full-stack validation used `http://localhost:3000/` with API on `http://localhost:8787`; those processes are not kept running by the distinct-voices packet.
- Earlier `GET /api/status` reported Claude configured and ElevenLabs not configured in that validation environment.
- Earlier `GET /api/stt/capability` returned fail-closed fallback because `ELEVENLABS_API_KEY` was not configured.
