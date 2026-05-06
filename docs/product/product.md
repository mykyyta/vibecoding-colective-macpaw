---
last_updated: 2026-05-06
owner: Strategist
---

# Product Apex

Vibecoding Collective is a prepared workspace for rapidly building a small AI-assisted prototype during a vibe-coding event.

## Current Product Claim

The current prototype is a short voice-operated quest room called **Exit MacPaw Space**, with the working scenario title **404 Door Not Found**.

A user is locked inside a simplified MacPaw Space room after a demo. The exit is in `demo lockdown`, and the user must leave by speaking with two characters: a human guard named Oleg and Pixel the cat. Oleg does not respond to useful commands until the user learns and uses his name. Pixel knows the exit code, but only reveals it after the user addresses Pixel directly and gently purrs.

The demo promise is that voice is not decorative. Spoken input moves the room state forward, name-based address unlocks character responses, a performed vocal action unlocks the code, and spoken output closes the interaction loop.

The main interface must be one fullscreen quest-room scene, not a dashboard or control panel. The visual target is the original MacPaw Space reference: black presentation wall on the left, open light floor through the center, warm wooden stepped seating on the right, vertical wood columns, ceiling fixtures, and precise warm LED lines. UI chrome must stay minimal enough that the room remains the product.

## Demo Scenario

The room shows a locked exit, a silent guard, and Pixel the cat near the door.

The happy path is intentionally small:

1. The user gives a generic door command; Oleg does not respond.
2. The room hints that the command has no addressee.
3. The user asks the guard his name.
4. The guard says his name is Oleg.
5. The user addresses Oleg by name and asks to open the door.
6. Oleg says the door is in `demo lockdown`, needs a code, and hints that Pixel was last near the keypad.
7. The user addresses Pixel directly, but Pixel does not reveal the code to ordinary commands.
8. The user gently purrs to Pixel.
9. Pixel reveals code `404`.
10. The user tells Oleg the code.
11. Oleg opens the door with the line: "404 accepted. Door not found, but exit found."

Core line:

> The room does not just listen for commands; it listens for who the user is speaking to and how they perform the voice interaction.

## Direction

- Build a small, demoable experience rather than a broad platform.
- Prefer an interaction where voice, narration, audio generation, or conversational behavior is central enough that ElevenLabs is not just a decorative integration.
- Treat voice as the only intended player input. Do not expose command buttons, typed command forms, progress panels, or dashboard controls in the main quest UI.
- Make the first screen a fullscreen illustrated room. Any microphone affordance or transcript indicator must be minimal and integrated into the scene.
- Prioritize visual fidelity to the MacPaw Space reference before adding visible gameplay UI.
- Optimize for a live demo run from the developer machine and exposed through a public HTTPS tunnel when external callbacks or ElevenLabs MCP need to reach it.
- Keep cloud deployment as a backup path, not the default, until the prototype needs a stable public backend.
- Preserve decisions in docs when they affect future implementation.

## Target User

Assume a demo viewer at the event who needs to understand within the first few seconds that the prototype listens, reacts, talks back, and lets voice drive progress through a room.

## Non-Goals

- No heavy architecture before the task is known.
- No permanent product claims hidden only in work plans.
- No integration with external services without clear demo value.
- No chatbot-only experience where voice merely reads static text.
- No complex inventory, map, scoring system, or long puzzle chain for the first demo.
- No visible mock command buttons or manual text input in the main quest experience.
- No side panels, logs, readiness boards, or progress dashboards on the primary game screen.
