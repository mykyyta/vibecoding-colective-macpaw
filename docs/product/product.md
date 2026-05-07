---
last_updated: 2026-05-07
owner: Strategist
---

# Product Apex

Vibecoding Collective is now a pet project for evolving a small voice-first AI
quest product beyond the original vibe-coding event prototype.

## Current Product Claim

The current product is a short voice-operated quest room called **Exit MacPaw Space**, with the working scenario title **404 Door Not Found**.

A user is locked inside a simplified MacPaw Space room after a `вайбкодінг івент` about AI and штучний інтелект. The exit is locked after the event, and the user must leave by speaking with two required characters: a human guard named Oleg and Pixel the cat. Oleg does not respond to useful commands until the user learns and uses his name. Pixel knows the exit code, but only reveals it after the user addresses Pixel directly and gently purrs.

Sofiia is also present as an optional supporting character. She is the Vibe
Coding Collective co-founder, product designer, and organizer of the first VCC
event in Ukraine at MacPaw Space. She is not the quest organizer or a game
master, and she does not know the exact solution. If asked for help, she offers
calm facilitation ideas and stage-safe hints without advancing the puzzle or
solving it for the player. If asked directly about Vibe Coding Collective or
vibe coding, she can briefly explain the community and event context.
She can also answer ordinary conversation when the player clearly addresses her
by name or a feminine address such as `дівчино`, `пані`, `lady`, or `woman`.
Unaddressed greetings and name questions should stay with the guard so the
quest's required first relationship remains legible.
Because the voice interaction is turn-based rather than a sustained dialogue,
Sofiia should answer in short statements and avoid follow-up questions, including
questions or assumptions about how the event feels.

Character irony should fit that event context: jokes may reference AI, штучний інтелект, prompts, generated decisions, and the `вайбкодінг івент`, but should not overuse generic tech metaphors or make every line sound like the same punchline.

The product promise is that voice is not decorative. Spoken input moves the room state forward, name-based address unlocks character responses, a performed vocal action unlocks the code, and spoken output closes the interaction loop.

The quest should be playable in Ukrainian and English without a visible language
selector. The system infers the player's language on each spoken turn, replies
in that language when confidence is sufficient, and keeps one shared quest state
when the player naturally switches languages between turns. Short ambiguous
turns such as `Pixel`, `404`, `meow`, or `mrr` should not cause unstable
language switching; they may keep the previous reliable language.

The microphone affordance may keep the primary control label fixed in English as
`Push to talk`, but it must clearly signal that both English and Ukrainian input
are accepted. The current compact hint is `EN/UA · sound on`, which also aligns
the mobile sound/vibration-adjacent prompt with the voice-first interaction.

Spoken output should make the characters legible by ear: Oleg, Pixel, Sofiia,
and the room/door should feel distinct when speech output is available. Oleg,
Pixel, Sofiia, and the room/door use distinct code-configured voices when
ElevenLabs TTS is configured. The room/door should use a calm female voice.
Pixel is a male cat and should sound lazy, smug, and slightly catlike rather
than like adult male narration or room narration describing a cat.

The main interface must be one fullscreen quest-room scene, not a dashboard or control panel. The visual target is the original MacPaw Space reference: black presentation wall on the left, open light floor through the center, warm wooden stepped seating on the right, vertical wood columns, ceiling fixtures, and precise warm LED lines. UI chrome must stay minimal enough that the room remains the product.

## Core Scenario

The room shows a locked exit, a silent guard, Pixel the cat near the door, and
Sofiia as a visible optional facilitator in the room.

The happy path is intentionally small:

1. The user gives a generic door command; Oleg does not respond.
2. The room hints that the command has no addressee.
3. The user asks the guard his name.
4. The guard says his name is Oleg.
5. The user addresses Oleg by name and asks to open the door.
6. Oleg says the exit is locked after the `вайбкодінг івент`, needs a code, and hints that Pixel was last near the exit panel.
7. The user addresses Pixel directly, but Pixel does not reveal the code to ordinary commands.
8. The user gently purrs to Pixel.
9. Pixel reveals code `404`.
10. The user tells Oleg the code.
11. Oleg opens the door with the line: "404 accepted. Door not found, but exit found."

The user may address the cat at any stage. Cat small talk never progresses
state and should answer in the cat's lazy, smug style in context of the phrase.
Before Oleg reveals the cat clue, cat small talk must not say the name Pixel,
mention the exit panel, or reveal code `404`. After the clue, the cat can be
addressed as Pixel, but code `404` is still revealed only by the purr
interaction.

Sofiia's Pixel-stage hints should be staged carefully. After Oleg points to
Pixel, Sofiia should only suggest addressing Pixel and talking to him calmly. She
should not suggest cat language, purring, meowing, or Pixel's own language until
Pixel has rejected an ordinary request.

At any stage, the user may ask Sofiia for an idea. Her answer does not progress
state. It should sound like a facilitator who believes a way out will be found:
calm, positive, non-competitive, and grounded in communication, exchange,
experimentation, and vibe-coding accessibility. Sofiia should not mention stages,
mechanics, hidden logic, or answer keys. Sofiia hint generation must use the
current quest-state hint context so the reply points to the player's current
step instead of generic encouragement.
Sofiia has two voice routes. For direct Sofiia-addressed turns, Claude decides
semantically whether the player is asking her for a quest idea, hint, help,
advice, direction, or next step. If yes, Sofiia gives a quest hint. Unaddressed
help requests do not route to Sofiia and do not advance the quest. Every other
Sofiia-directed or VCC/vibe-coding context turn uses one conversation route where
Claude answers from her brief and the current context.
The user may also simply talk with Sofiia if they address her directly by name or
a feminine address. In that case she should answer organically from her
facilitator and product-designer role, without becoming a required puzzle step.
Her conversation replies may be generated for variety, but must stay as compact
statements rather than open questions or unwanted event banter.

Core line:

> The room does not just listen for commands; it listens for who the user is speaking to and how they perform the voice interaction.

## Direction

- Build a small, playable product rather than a broad platform.
- Prefer an interaction where voice, narration, audio generation, or conversational behavior is central enough that ElevenLabs is not just a decorative integration.
- Treat voice as the only intended player input. Do not expose command buttons, typed command forms, progress panels, or dashboard controls in the main quest UI.
- Support Ukrainian and English voice play through automatic per-turn language
  detection, not a manual in-room language selector.
- Keep microphone control copy compact: `Push to talk` may remain fixed English,
  while the nearby hint should tell players that English and Ukrainian are both
  valid and that sound should be on.
- Make the first screen a fullscreen illustrated room. Any microphone affordance or transcript indicator must be minimal and integrated into the scene.
- Prioritize visual fidelity to the MacPaw Space reference before adding visible gameplay UI.
- A leaderboard affordance may exist as a small neutral control integrated into
  the left presentation screen. It should switch that screen into recent
  completions, and after quest completion it may open automatically into name
  entry and the leaderboard result. It must not use the puzzle code as a label
  and must not become a permanent sidebar or dashboard.
- Optimize for local iteration and a stable cloud path when the product needs persistence, external callbacks, or shareable access.
- Treat persistent user-facing features, such as leaderboard entries after quest completion, as durable product capabilities rather than throwaway demo state.
- Preserve decisions in docs when they affect future implementation.

## Target User

Assume a casual player or project reviewer who needs to understand within the first few seconds that the product listens, reacts, talks back, and lets voice drive progress through a room.

## Non-Goals

- No heavy architecture before the product need is clear.
- No permanent product claims hidden only in work plans.
- No integration with external services without clear product value.
- No chatbot-only experience where voice merely reads static text.
- No complex inventory, map, scoring system, or long puzzle chain until the core quest loop is strong.
- No visible mock command buttons or manual text input in the main quest experience.
- No visible language selector in the main quest experience.
- No persistent side panels, logs, readiness boards, or progress dashboards on the primary game screen.
