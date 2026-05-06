---
state: active
last_updated: 2026-05-06
owner: Planner
---

# Mobile Quest Room Adaptation

## Purpose

Adapt the **Exit MacPaw Space** voice quest so it is demoable on mobile without
turning the room into a dashboard or losing the MacPaw Space visual promise.

## Outcome Shape

The mobile experience still opens directly into the fullscreen quest room. The
room remains the interface: Pixel, Oleg, the exit, the listening affordance, and
the current spoken response are visible and usable on a narrow touch viewport.

Mobile should not become a separate simplified product. It should be the same
voice-only quest, scaled and composed for one-handed phone use:

- the scene fits the viewport without horizontal scrolling;
- the primary room elements remain recognizable;
- the press-and-hold mic interaction is reachable by thumb;
- speech bubbles and hints do not cover Pixel, Oleg, the door, or the mic;
- the final door-opening reward is visible on mobile;
- browser or ElevenLabs speech fallback behavior remains unchanged.

## Why This Is Initiative-Scale

This needs multiple coordinated packets:

- a mobile audit packet to identify concrete layout, overlap, touch, and browser
  risks;
- a responsive scene packet for the room geometry and character placement;
- a touch/voice controls packet for mic ergonomics and mobile browser behavior;
- a visual QA packet that verifies desktop and mobile screenshots after changes.

The work touches user-facing layout and interaction behavior and has explicit
desktop regression risk, so it should be tracked as an Initiative rather than a
chat-only ticket.

## Scope In

- Mobile viewport support for the existing React/Vite room.
- Responsive CSS for the room, characters, exit, mic, speech bubble, ambient
  hint, and final reward.
- Touch-friendly press-and-hold microphone behavior.
- Desktop regression protection for the current fullscreen scene.
- Local verification on at least one phone-sized viewport and one desktop
  viewport.

## Scope Out

- New room art direction.
- New quest mechanics.
- New visible command buttons or typed input.
- Replacing ElevenLabs STT/TTS integration.
- Cloud deployment.
- Native mobile app packaging.
- Long-term multi-device session sync.

## Acceptance Criteria

- The first screen on mobile is still the playable room, not a landing page or
  dashboard.
- No horizontal scroll appears on common mobile widths.
- Oleg, Pixel, the exit, mic affordance, and active reply bubble are visible or
  intentionally layered at every quest state.
- The mic interaction is large enough for touch and reachable near the bottom of
  the viewport.
- Text in bubbles, hints, and controls fits without clipping or incoherent
  overlap.
- The happy path can still be completed with voice input on a mobile browser
  when microphone permission is granted.
- Desktop layout remains recognizably the existing MacPaw Space room.
- `npm run typecheck` passes.

## Packets

### Packet 1: Mobile Layout Audit

Goal: Identify the exact mobile failures before changing layout.

Scope in:

- run the current app locally;
- inspect at least `390x844` and desktop viewport;
- capture screenshots or notes for layout overlap, clipped text, unreachable
  controls, and scene framing;
- note any active uncommitted UI changes that affect the audit.

Scope out:

- implementation changes;
- backend changes;
- redesign proposals beyond concrete findings.

Acceptance criteria:

- Audit names the failing viewport/state combinations.
- Audit lists the minimum layout areas to change.
- Audit distinguishes current committed behavior from uncommitted local UI
  edits if both are present.

Validation:

- local browser or Playwright screenshot check;
- `npm run typecheck` only if audit requires running the app build.

Status: completed.

### Packet 2: Responsive Room Composition

Goal: Make the room scene fit mobile without losing the core MacPaw Space visual
signals.

Scope in:

- `src/client/styles.css`;
- narrow viewport layout rules for room geometry, door, Pixel, Oleg, seating,
  mic, bubble, hint, and final reward;
- preserve existing desktop composition.

Scope out:

- backend changes;
- new assets;
- new quest states;
- replacing the mic interaction.

Acceptance criteria:

- No horizontal scroll on phone-sized viewport.
- Pixel, Oleg, and exit remain visible and legible.
- Speech bubble and mic do not obscure the active puzzle object.
- Desktop screenshot remains visually consistent with the current room.
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`;
- mobile and desktop screenshot inspection.

Status: completed.

### Packet 3: Mobile Voice Control Ergonomics

Goal: Make the press-and-hold voice interaction reliable and understandable on
mobile browsers.

Scope in:

- `src/client/App.tsx`;
- touch/pointer behavior for mic hold, cancel, release, and busy states;
- minimal copy adjustments only where current mobile behavior is unclear;
- permission/error state visibility on mobile.

Scope out:

- adding typed input;
- adding command buttons;
- replacing STT providers.

Acceptance criteria:

- Touch hold starts listening and release submits or stops consistently.
- Busy/listening states do not trap the user.
- Error messages fit the mobile viewport.
- Desktop pointer and keyboard behavior still works.
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`;
- local mobile-browser or emulated pointer smoke.

Status: ready.

### Packet 4: Mobile Visual QA And Integration Pass

Goal: Verify the integrated mobile experience across key quest states and fix
remaining layout regressions.

Scope in:

- desktop and mobile screenshots for idle, listening, guard reply, Pixel reply,
  code revealed, and door opened states;
- focused CSS fixes for overlaps or clipping found during QA;
- status update with validation results.

Scope out:

- new feature work;
- broad visual redesign;
- provider or deployment work.

Acceptance criteria:

- Key states pass mobile and desktop screenshot review.
- Any remaining mobile limitations are documented clearly.
- Initiative status records validation and next action.

Validation:

- `npm run typecheck`;
- screenshot review on mobile and desktop viewports.

Status: pending Packets 2 and 3.

## First Execution Unit

Packet 1, **Mobile Layout Audit**, is the first execution unit.

Executor packet:

- Goal: audit current mobile layout and identify the smallest responsive fixes.
- Scope in: run/inspect the current app, capture mobile and desktop findings,
  and account for existing local UI edits in `src/client/App.tsx` and
  `src/client/styles.css`.
- Scope out: implementation changes.
- Acceptance criteria: same as Packet 1.
- Validation: local browser or Playwright screenshots at phone and desktop
  sizes.

## Owner And Mode

- Planner owns packet boundaries until execution starts.
- Orchestrator owns status advancement after packet handoffs.
- Executors own individual packets.
- Current mode: event-speed, preserve demo-first behavior.

## Open Questions

- Which mobile viewport is the live-demo target: iPhone, Android, or generic
  responsive phone?
- Should landscape mobile be supported for the event, or only portrait?
- Should mobile testing prioritize browser speech recognition, ElevenLabs STT,
  or both?
