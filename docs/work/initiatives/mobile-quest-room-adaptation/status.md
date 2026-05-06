---
state: active
last_updated: 2026-05-06
owner: Orchestrator
---

# Mobile Quest Room Adaptation Status

## Summary

Initiative opened to adapt the current **Exit MacPaw Space** voice quest for
mobile phone viewports while preserving the fullscreen room-first product
promise.

## Packet Status

| Packet | Owner | Status | Notes |
| --- | --- | --- | --- |
| Mobile Layout Audit | Unassigned | Ready | First packet. Audit current mobile failures before implementation. |
| Responsive Room Composition | Unassigned | Pending | Waits for audit findings. |
| Mobile Voice Control Ergonomics | Unassigned | Pending | Waits for audit findings. |
| Mobile Visual QA And Integration Pass | Unassigned | Pending | Waits for responsive layout and control packets. |

## Current Decisions

- This is Initiative-scale because it requires audit, responsive layout,
  touch-control behavior, and screenshot QA with desktop regression risk.
- Mobile must keep the same voice-only quest. It must not introduce visible
  command buttons, typed input, progress dashboards, or a separate mobile
  control panel.
- The first mobile screen should remain the playable room.
- Desktop visual fidelity remains a constraint; mobile adaptation should not
  degrade the current desktop room.

## Active Constraints

- Existing local worktree has uncommitted UI edits in `src/client/App.tsx` and
  `src/client/styles.css`. Packet owners must account for them and avoid
  reverting unrelated user changes.
- Keep the app runnable with `npm run dev`.
- Validate with the smallest meaningful checks: `npm run typecheck` and mobile
  plus desktop screenshot review once implementation starts.
- Do not change ElevenLabs STT/TTS behavior as part of mobile layout work unless
  a mobile browser issue requires a narrowly scoped control fix.

## Next Action

Dispatch Packet 1, **Mobile Layout Audit**, to Executor.

First packet handoff:

- Goal: audit the current mobile layout and identify the smallest responsive
  fixes.
- Scope in: run or inspect the current app, capture findings for phone and
  desktop viewports, and explicitly note whether uncommitted local UI edits
  affect observed behavior.
- Scope out: implementation changes, backend changes, new mechanics.
- Acceptance: failing viewport/state combinations are named, minimum layout
  areas to change are listed, and committed-vs-local-edit behavior is clear.
- Validation: local browser or Playwright screenshots at a phone-sized viewport
  such as `390x844` and a desktop viewport.

## Risks

- The current room is visually dense; naive scaling may make Pixel, Oleg, or the
  exit too small to read.
- Mobile browser speech recognition and microphone permission behavior differ
  by browser; layout fixes should not assume only one browser unless the event
  demo target is fixed.
- Existing uncommitted UI edits may already change hint/firework behavior, so
  the audit must avoid confusing those edits with committed baseline behavior.

## Latest Validation

- Initiative docs created. No app validation run yet for this initiative.
