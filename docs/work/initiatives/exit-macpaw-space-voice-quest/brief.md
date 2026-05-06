---
state: active
last_updated: 2026-05-06
owner: Planner
---

# Exit MacPaw Space Voice Quest

## Purpose

Build the first demoable slice of **Exit MacPaw Space**, a voice-operated 2D quest room where the user learns character names, addresses them directly, and gently purrs to Pixel the cat to unlock the exit.

## Outcome Shape

The demo opens directly into a single fullscreen drawn MacPaw Space-inspired room. The room itself is the interface; there are no visible command buttons, manual input forms, side panels, progress dashboards, or development controls in the primary experience.

The visual target is the original MacPaw Space reference:

- black stage or presentation wall on the left;
- open light floor through the center;
- warm wooden stepped seating on the right;
- vertical wood columns;
- ceiling fixtures and rails;
- precise warm LED strips;
- clean architectural perspective and depth.

The working scenario title is **404 Door Not Found**. The user can progress through a small ironic quest loop using voice only:

1. Give a generic command to open the door.
2. See that the guard does not respond because no addressee was identified.
3. Ask the guard his name.
4. Learn that the guard is named Oleg.
5. Address Oleg by name and ask him to open the door.
6. Learn that the door is in `demo lockdown`, needs a code, and that Pixel was last near the keypad.
7. Address Pixel directly.
8. Discover that Pixel does not reveal the code to ordinary commands.
9. Gently purr to Pixel.
10. Receive code `404` from Pixel.
11. Tell Oleg the code.
12. Watch the door open and exit the room.

The first implementation may keep mock state internally for development, but mock command buttons and typed command inputs must not be visible in the main quest UI.

## Why This Is Initiative-Scale

This requires multiple coordinated packets:

- a visual frontend packet for the illustrated room, characters, UI states, and animations;
- a backend/voice packet for speech input, response generation, ElevenLabs speech output, purr/vocalization handling, and state integration;
- an integration pass that connects visual states to real voice-driven game events.

The visual and backend work can move independently, but they need a shared scenario and state model.

## Scope In

- One room only.
- Two characters: guard and Pixel.
- One secret: Pixel knows the code.
- Name-gated interaction: useful guard commands require learning and using Oleg's name.
- Audio-first unlock: Pixel reveals the code only after being addressed directly and hearing gentle purring.
- Minimal quest state: door locked, unnamed command ignored, Oleg named, guard hint given, Pixel addressed, Pixel ignoring, purr accepted, code revealed, door open, escaped.
- Fullscreen visual frontend that closely communicates the MacPaw Space reference.
- Voice-only intended input in the primary experience.
- Minimal microphone/listening indication integrated into the scene.
- Voice-ready architecture that can later connect browser speech recognition and ElevenLabs output.

## Scope Out

- Multiple rooms.
- Inventory system.
- Map navigation.
- Scoring.
- Complex puzzle chains.
- Cloud deployment unless required for a live external integration.
- A generic chatbot layout.
- Visible mock command buttons in the main experience.
- Manual text input in the main experience.
- Side panels, logs, readiness boards, or progress dashboards on the primary game screen.

## Acceptance Criteria

- The first screen is the playable room, not a landing page.
- A demo viewer can understand the goal within a few seconds: speak to characters to exit MacPaw Space.
- The frontend presents one fullscreen scene with strong fidelity to the MacPaw Space reference.
- The primary UI offers no visible command buttons, manual command input, side panel, dialogue log, or progress dashboard.
- Voice is the only intended player input.
- Pixel is clearly the hidden solution, not decoration.
- The user must perform an audible purr-like interaction before Pixel reveals the code.
- The door opening is a visible reward moment.
- The code path stays small enough to run locally during the event.

## Packets

### Packet 1: Visual Quest Room

Goal: Create the visual-only React interface for the room and mocked quest flow.

Scope in:

- `src/client/App.tsx`
- `src/client/styles.css`
- illustrated room using code-native HTML/CSS/SVG layers;
- guard, Pixel, door, mic control, speech bubble, progress chips;
- simple state animations for listening, unnamed command ignored, guard speaking, Pixel ignored/helpful, purr accepted, and door opening;
- mock controls or manual input for the happy path.

Scope out:

- backend calls;
- shared API contract changes;
- provider code;
- docs updates beyond handoff notes.

Acceptance criteria:

- The room is immediately visible.
- Mock state can move through unnamed command ignored, Oleg named, guard hint, Pixel ignored, purr accepted, code revealed, and door open states.
- Layout works on desktop and mobile.
- `npm run typecheck` passes or any failure is clearly attributed.

Status: dispatched to visual frontend agent.

### Packet 1A: Fullscreen Voice-Only Scene Redesign

Goal: Replace the first visual pass with a single fullscreen scene that prioritizes MacPaw Space reference fidelity and removes visible non-voice controls.

Scope in:

- `src/client/App.tsx`
- `src/client/styles.css`
- one 100vw/100vh room scene;
- stronger architectural perspective matching the reference;
- black presentation wall left, light floor center, wooden stepped seating right, columns, ceiling fixtures, LED strips;
- guard and Pixel embedded subtly in the scene;
- minimal microphone/listening indicator only if it does not read as a control panel;
- no visible mock command buttons, manual input, progress panel, dialogue log, or dashboard.

Scope out:

- backend calls;
- shared API changes;
- game mechanic expansion;
- mobile-specific layout or polish for the current pass;
- new docs beyond handoff/status updates.

Acceptance criteria:

- The app opens to one fullscreen room.
- The room visually reads closer to the MacPaw Space reference than the previous pass.
- The only intended interaction is voice.
- No visible command buttons or typed input are present in the main UI.
- Desktop/in-app browser fidelity is prioritized; mobile is not a requirement for this pass.
- `npm run typecheck` passes or any failure is clearly attributed.

Status: dispatched to frontend redesign agent.

### Packet 2A: Quest Logic Contract

Goal: Implement the deterministic quest state machine and shared response contract without calling external providers.

Scope in:

- shared quest state and event types for unnamed commands, name discovery, Oleg-directed commands, Pixel-directed commands, purr-like vocalizations, code, and door commands;
- deterministic transcript classifier for quest triggers and smalltalk;
- state transition function that owns all progression gates;
- canned fallback replies for each important state so the demo works without Claude or ElevenLabs;
- response payload that identifies speaking character, reply text, quest state changes, trigger classification, and optional audio metadata.

Scope out:

- Claude-generated dialogue;
- ElevenLabs STT or TTS calls;
- browser microphone integration;
- persistent sessions;
- multi-user state;

Acceptance criteria:

- The happy path can be completed through deterministic text inputs.
- Generic door commands do not progress before Oleg is named.
- Oleg-directed commands do not work unless the user learned and uses Oleg's name.
- Pixel does not reveal `404` before direct Pixel address plus purr-like input.
- Code `404` opens the door only after Pixel has revealed it.
- Smalltalk produces a reply but does not change quest state.
- `npm run typecheck` passes.

Status: ready.

Validation:

- `npm run typecheck`
- targeted smoke checks against the quest transition function or `/api/voice-turn` using the happy path and blocked-path inputs.

Risks:

- Browser or ElevenLabs STT may transcribe purring inconsistently; keep purr markers broad and observable in logs during development.

### Packet 2B: Backend Dialogue And Audio Response

Goal: Connect the quest logic to the Express voice route, Claude-generated character replies, and optional ElevenLabs TTS.

Scope in:

- `/api/voice-turn` accepts transcript plus current quest state or lightweight session id;
- backend runs the deterministic quest classifier and transition first;
- Claude receives only the current state, allowed actor, user transcript, and strict constraints for what may be revealed;
- Claude may write ironic smalltalk and in-state replies but must not decide quest progression;
- fallback canned replies are used when Claude is not configured or fails;
- ElevenLabs TTS generates audio for backend-approved replies when configured;
- browser speech fallback remains acceptable when ElevenLabs TTS is not configured.

Scope out:

- ElevenLabs realtime STT;
- long-term conversation memory;
- database persistence;
- multi-user rooms;
- paid provider calls without configured credentials.

Acceptance criteria:

- The API returns stable JSON for actor, reply, quest state, trigger classification, and optional audio.
- Claude cannot reveal `404` unless the state machine has accepted the purr trigger.
- Claude cannot open the door or advance state by itself.
- Provider failures return useful fallback replies and do not break the quest.
- The API does not expose secrets.
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`
- local API smoke checks with providers disabled;
- local API smoke checks with configured providers when keys exist in `.env`.

Risks:

- Claude latency can slow the demo; keep canned replies as an immediate fallback path.
- TTS generation can add latency; keep replies short and state-specific.

Status: pending Packet 2A.

### Packet 2C: ElevenLabs Realtime STT Bridge

Goal: Add the smallest ElevenLabs speech-recognition path needed for the voice-only demo.

Scope in:

- server-side route to mint short-lived ElevenLabs realtime STT access for the browser, without exposing `ELEVENLABS_API_KEY`;
- client-side microphone streaming to ElevenLabs realtime STT;
- committed transcript handling that sends final user turns to `/api/voice-turn`;
- purr-marker observability so we can see how `мур`, `мрр`, and similar sounds are transcribed during testing;
- browser speech recognition remains as a fallback if ElevenLabs STT is unavailable.

Scope out:

- custom audio model training;
- full audio emotion detection;
- long audio recording storage;
- exposing raw provider credentials to the browser.

Acceptance criteria:

- A spoken user turn reaches the backend as a committed transcript.
- Purr-like attempts are visible enough to tune marker detection.
- The app still works with browser speech recognition fallback when ElevenLabs STT is unavailable.
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`
- local browser smoke test with microphone permission;
- provider-enabled smoke test only when `ELEVENLABS_API_KEY` is configured.

Risks:

- Purring may be transcribed as silence or non-useful text; if so, use a dev-tuned fallback such as detecting sustained voiced audio or accepting repeated `мур` prompt text for the event slice.

Status: pending Packet 2B.

### Packet 3: Frontend/Backend Integration

Goal: Connect the visual room to real voice-driven state changes.

Scope in:

- ElevenLabs realtime STT when available;
- browser speech recognition fallback;
- ElevenLabs TTS or browser speech playback;
- mapping backend quest events to visual states and animations.

Scope out:

- new visual redesign;
- broader architecture changes.

Acceptance criteria:

- The full quest works from voice input.
- Each important command visibly changes the room.
- The final door opening follows the correct name, Pixel, purr, and code flow.
- The app starts with the existing local dev command.

Status: pending packet 2B or 2C, depending on whether browser speech fallback is enough for first integration.

## First Execution Unit

Packet 2A is current because the completed fullscreen scene is available, and backend/audio work needs a deterministic quest contract before Claude or ElevenLabs can be safely connected.

## Owner And Mode

- Planner owns packet boundaries until execution starts.
- Orchestrator owns status advancement after packet handoffs.
- Executors own individual packets.
- Current mode: event-speed, local-demo first.

## Open Questions

- Should the guard and Pixel replies be Ukrainian-only for the demo, or bilingual?
- Is marker-based purr detection enough for the first demo, or should we add an audio-level purr detector later?
- Which ElevenLabs voices should represent the guard and Pixel once credentials are available?
