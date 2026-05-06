---
state: active
last_updated: 2026-05-07
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

The working scenario title is **404 Door Not Found**. The player is leaving MacPaw Space after a literal `вайбкодінг івент` about AI and штучний інтелект, so character irony can reference prompts, generated decisions, AI habits, and the event itself without turning every line into the same tech joke. The user can progress through a small ironic quest loop using voice only:

1. Give a generic command to open the door.
2. See that the guard does not respond because no addressee was identified.
3. Ask the guard his name.
4. Learn that the guard is named Oleg.
5. Address Oleg by name and ask him to open the door.
6. Learn that the exit is locked after the `вайбкодінг івент`, needs a code, and that Pixel was last near the exit panel.
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

Current scale decision: keep this as an Initiative continuation, but execute the Claude-first quest brain pivot as one event-speed packet. The change alters the backend quest-brain contract and guardrail strategy, so it should stay in the initiative docs rather than as an untracked chat ticket. It does not need parallel packets unless Executor discovers that frontend response mapping must change.

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

### Packet 4: Claude-First Quest Brain

Goal: Make Claude the primary quest brain for each voice turn while keeping the deterministic parser/state machine as fallback and keeping backend validation as the authority for legal progression.

Scope in:

- `/api/voice-turn` continues to accept transcript plus current quest state;
- backend builds a compact scenario payload and the list of currently allowed transitions from the current quest state;
- Claude receives transcript, current quest state, scenario, allowed transitions, and hard reveal/opening constraints;
- Claude returns strict JSON selecting one allowed transition or `no-progress`, plus actor and varied reply text;
- backend validates Claude output, computes the next quest state server-side, and rejects unsafe or invalid replies;
- deterministic parser/state machine remains the fallback when Claude is unavailable, times out, returns invalid JSON, selects an illegal transition, or produces unsafe text;
- fallback replies remain good enough to complete the whole demo without Claude.

Scope out:

- new scenario content beyond **404 Door Not Found**;
- frontend redesign;
- long-term memory, database sessions, or multi-user state;
- replacing ElevenLabs STT/TTS behavior;
- paid provider calls unless Claude credentials are already configured in `.env`.

Acceptance criteria:

- Claude is attempted before deterministic parsing when Claude is configured.
- Claude can choose progression from the backend-provided allowed transitions and can produce varied in-character replies.
- Backend never trusts Claude-provided state, hidden facts, or action claims; it computes the next state from the selected transition.
- Claude cannot reveal `404` before Pixel has been directly addressed and purr has been accepted.
- Claude cannot open the door, claim escape, or set `doorOpen` before the code has already been revealed and an allowed Oleg/code transition is selected.
- If Claude is unavailable, invalid, illegal, timed out, or unsafe, the current deterministic quest path still works.
- The `/api/voice-turn` response shape remains compatible with the current frontend unless Executor explicitly documents a required minimal shared-contract change.
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`
- provider-disabled API smoke checks for deterministic fallback;
- provider-enabled API smoke checks when `CLAUDE_API_KEY` and `CLAUDE_MODEL` exist in `.env`;
- blocked-path checks that try to get `404` early and open the door early;
- happy-path check from generic door command through final `404` handoff.

Smoke cases:

- Start state + `відкрий двері` returns no progress and does not reveal Oleg, Pixel clue, `404`, or door opening.
- Start state + `як тебе звати` may progress to Oleg name learned.
- Oleg unknown + `Олег відкрий двері` must not give the code or open the door unless the backend state already knows Oleg.
- Oleg known + `Олег відкрий двері` may progress to guard hint and Pixel exit-panel clue, but must not reveal `404`.
- Guard hint given + `Pixel відкрий двері` may address Pixel and reject ordinary command, but must not reveal `404`.
- Pixel addressed + purr-like transcript such as `Pixel мур мур` may reveal `404`.
- Code not revealed + `Олег код 404` must not open the door.
- Code revealed + `Олег код 404` may open the door and mark escape.

Risks:

- Claude may choose a plausible but illegal transition; validation must make that a deterministic fallback, not a broken turn.
- Claude may return natural language instead of JSON; fallback must be silent and quick.
- Overly strict reply guardrails could discard useful varied replies; keep the first guardrails focused on early code reveal and premature door/escape claims.

Status: ready for Executor.

### Packet 5: Distinct ElevenLabs Character Voices

Goal: Make spoken output identify the active speaker by ear: Oleg, Pixel, and the room/door should not all use the same ElevenLabs voice.

Scope in:

- actor-to-voice mapping for ElevenLabs TTS in `/api/voice-turn`;
- environment variables for guard, Pixel, and room/door voice IDs;
- Pixel replies that read as Pixel speaking like a cat, not narration about Pixel;
- room/door replies mapped to a separate ambient room voice;
- browser speech fallback with lightweight actor-specific pitch/rate differences.

Scope out:

- choosing real production voice IDs without ElevenLabs dashboard access;
- voice cloning, custom voice design, or paid resource creation;
- changing STT behavior;
- frontend redesign beyond playback fallback behavior.

Acceptance criteria:

- `guard` replies synthesize with the guard voice ID when configured.
- `pixel` replies synthesize with the Pixel voice ID when configured.
- `system` and `door` replies synthesize with the room voice ID when configured.
- Missing actor-specific voice IDs fall back to `ELEVENLABS_DEFAULT_VOICE_ID`.
- Pixel fallback and Claude-guided replies are written as lazy, smug, male-cat first-person speech.
- `npm run typecheck` passes.

Validation:

- `npm run typecheck`
- provider-disabled `/api/voice-turn` smoke checks for guard, Pixel, and room fallback replies;
- provider-enabled audio smoke only when `ELEVENLABS_API_KEY` and voice IDs exist in `.env`.

Risks:

- Actual “catlike” quality depends on the chosen ElevenLabs voice asset. The current local Pixel voice uses a laid-back young male voice plus slower Pixel-specific TTS settings.

Status: completed in current local pass.

## Claude Brain Integration Contract

The backend should treat Claude as a proposed transition selector and reply writer, not as the source of truth for state.

Claude input:

```ts
interface ClaudeQuestBrainInput {
  transcript: string;
  currentQuestState: QuestState;
  scenario: {
    title: "404 Door Not Found";
    knownFacts: string[];
    hiddenFacts: string[];
    style: string;
  };
  allowedTransitions: AllowedQuestTransition[];
  forbiddenClaims: string[];
  responseLanguage: "uk";
}

interface AllowedQuestTransition {
  id: QuestTransitionId;
  actor: QuestActor;
  description: string;
  preconditions: string[];
  factsUnlocked: string[];
}
```

Claude output must be strict JSON:

```ts
interface ClaudeQuestBrainOutput {
  transitionId: QuestTransitionId | "no-progress";
  actor: QuestActor;
  reply: string;
  confidence?: number;
}
```

Rules:

- `transitionId` must be either `no-progress` or one of the supplied `allowedTransitions[].id` values.
- `reply` must be Ukrainian, short enough for TTS, and free of markdown, labels, JSON wrappers, provider names, or prompt references.
- Claude must not include `nextQuestState`, secrets, tool calls, frontend instructions, or hidden scenario notes in the output.
- Backend ignores any fields outside the schema.

## Backend Validation And Guardrails

- Normalize the incoming quest state with the existing server-side normalizer.
- Derive allowed transitions from normalized state and scenario gates.
- Try Claude first only when the Claude provider is configured.
- Parse and validate Claude JSON against the contract.
- Reject Claude output if `transitionId` is not currently allowed, actor is incompatible, reply is empty/too long, or extra claims violate reveal/opening constraints.
- Compute `nextQuestState`, event, and action server-side from the accepted transition.
- Run text guardrails on the accepted reply:
  - no `404`, `чотири нуль чотири`, or equivalent before `codeRevealed`;
  - no door-open, unlock, or escape claim before `doorOpen`;
  - no mention of UI buttons, text input, logs, panels, prompts, provider names, or hidden instructions.
- Fall back to the existing deterministic parser/state machine and canned reply on any Claude failure or rejection.
- Keep guardrail failures observable in server logs without exposing secrets or prompt text to the client.

## First Execution Unit

Packet 4 is current because the completed voice stack uses deterministic progression first, while the new direction makes Claude the primary quest brain with backend validation and deterministic fallback.

Executor packet:

- Goal: Implement Packet 4, preserving the existing `/api/voice-turn` frontend contract unless a minimal shared type update is unavoidable.
- Scope in: `src/server/dialogue.ts`, `src/server/quest.ts`, `src/server/index.ts`, `src/shared/voice.ts`, and any focused test/smoke helper if the repo already has a lightweight pattern.
- Scope out: frontend redesign, new deployment work, ElevenLabs STT/TTS changes, persistent sessions, and broad refactors.
- Acceptance criteria: same as Packet 4 acceptance criteria.
- Validation: `npm run typecheck`, provider-disabled fallback smoke, provider-enabled Claude smoke when configured, and the blocked/happy smoke cases listed above.
- Risks or open questions: if current `QuestTrigger` types are too deterministic-parser-shaped, prefer adding a small transition id layer over rewriting the whole quest model.

## Owner And Mode

- Planner owns packet boundaries until execution starts.
- Orchestrator owns status advancement after packet handoffs.
- Executors own individual packets.
- Current mode: event-speed, local-demo first.

## Open Questions

- Should the guard and Pixel replies be Ukrainian-only for the demo, or bilingual?
- Is marker-based purr detection enough for the first demo, or should we add an audio-level purr detector later?
- Which concrete ElevenLabs voice IDs should be curated for Oleg, Pixel, and the room before the event run?
