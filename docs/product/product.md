---
last_updated: 2026-05-09
owner: Strategist
---

# Product Apex

Vibecoding Collective is now a pet project for evolving a small voice-first AI
quest product beyond the original vibe-coding event prototype.

## Current Product Claim

The current product is a short voice-operated quest room called **Exit MacPaw
Space**, with the scenario subtitle **Badge Not Found**.

A user is in a simplified MacPaw Space room after a `вайбкодінг івент` about AI
and штучний інтелект. The event is over, the door appears to be locked by a code
panel, and the user must find a way out by speaking with the event organizers
and the cats in the room.

There is no guard. There is no room or door voice. The interactive cast is:

- **Sofiia**: Vibe Coding Collective co-founder, product designer, and event
  organizer. She is the default responder for unaddressed turns.
- **Dan**: event organizer who can inspect the door panel and enter the code
  once the player finds it.
- **Hoover**: the white cat near the door or exit area. Hoover knows that Fixel
  took the badge, but only reveals that clue after the player addresses Hoover
  directly and gently.
- **Fixel**: the brown cat sleeping above or near the stage. Fixel has the
  organizer badge under him. Fixel does not speak in words; after a plausible
  waking attempt he only purrs, grumbles, or makes a sleepy cat sound while the
  visual state reveals the badge code.

The product promise is that voice is not decorative. Spoken input moves the room
state forward, address-based routing determines who answers, performed speech
style can unlock character responses, and spoken output closes the interaction
loop.

The quest should be playable in Ukrainian and English without a visible language
selector. The system infers the player's language on each spoken turn, replies
in that language when confidence is sufficient, and keeps one shared quest state
when the player naturally switches languages between turns. Short ambiguous
turns such as `Hoover`, `Fixel`, `404`, `hey`, or `бу` should not cause unstable
language switching; they may keep the previous reliable language.

The microphone affordance may keep the primary control label fixed in English as
`Push to talk`, but it must clearly signal that both English and Ukrainian input
are accepted. The current compact hint is `EN/UA · sound on`, which also aligns
the mobile sound/vibration-adjacent prompt with the voice-first interaction.

Spoken output should make the speaking characters legible by ear: Sofiia, Dan,
and Hoover should feel distinct when speech output is available. They use
distinct code-configured voices when ElevenLabs TTS is configured. Hoover should
read as an observant and selective cat. Fixel is a nonverbal puzzle actor: he
should not receive spoken dialogue or expository TTS lines, only short sleepy
cat sounds such as purrs or grumbles paired with visual state changes.

The main interface must be one fullscreen quest-room scene, not a dashboard or
control panel. The visual target is the original MacPaw Space reference: black
presentation wall on the left, open light floor through the center, warm wooden
stepped seating on the right, vertical wood columns, ceiling fixtures, and
precise warm LED lines. UI chrome must stay minimal enough that the room remains
the product.

Character name labels may appear as small in-scene tags after the LLM decides a
character's proper name was spoken in the player transcript or in the character
reply. These labels are visual memory only: they do not progress quest state and
must respect the same reveal gates as the dialogue path.

## Core Scenario

The room shows a locked exit, Sofiia, Dan, Hoover near the door, and Fixel
sleeping above or near the stage.

The happy path is intentionally small:

1. The user gives a generic door command or asks what is happening.
2. Because there is no explicit addressee, Sofiia answers with short general
   context: the event is over, the door seems locked, and Dan may know more
   about the door panel.
3. The user addresses Dan and asks him to open the door, check the door, or
   enter a code.
4. Dan checks the door and says it looks like a code lock. He cannot open it
   yet, but he noticed Hoover hanging around near the door.
5. The user addresses Hoover directly.
6. Hoover does not move the quest forward until the user addresses him gently.
7. When addressed gently, Hoover says that Fixel took the badge.
8. Fixel is visible from the start. After Hoover points to Fixel, the visual
   state reveals the edge of a badge under Fixel, but the code is still hidden.
9. The user addresses Fixel and tries to wake him.
10. Fixel wakes lazily or rolls over with a nonverbal sleepy cat sound. The
    badge becomes visible and reveals code `404`.
11. The user tells code `404` to Dan.
12. Dan enters the code and opens the door with the line:
    `Код 404. Двері відчинено. Дякуємо, що були з нами.` /
    `Code 404. Door open. Thanks for being with us.`

This ending should feel like an organizer closing the event, not a guard
granting escape.

Core line:

> The room does not just listen for commands; it listens for who the user is
> speaking to and how they perform the voice interaction.

## Character Rules

Sofiia is the default responder for unaddressed turns. For ordinary unaddressed
turns, she gives short general context rather than a puzzle solution. She may
mention Dan early because Dan is the natural door-panel person. She must not
mention Hoover, Fixel, the badge, or code `404` before the player reaches those
facts through the quest path.

Sofiia gives hints only when the player directly asks Sofiia for a hint, idea,
help, advice, or next step. She should sound like a calm event organizer and
facilitator who believes a way out will be found. She should not become a game
master, narrator, answer key, or generic chatbot.

Dan is not a guard. He is an event organizer who can inspect the door panel and
enter the code. He should feel competent but constrained by the missing badge or
code. He should not know or reveal the code before Fixel reveals the badge.

Hoover is the white cat near the door. Hoover reveals the Fixel clue only after
a direct, gentle Hoover-addressed turn. The LLM may decide gentleness from the
semantics and implied tone of the transcript, but backend state gates must still
prevent early progression.

Acceptable Hoover gentleness examples include:

- `Hoover, please help us.`
- `Hoover, sweet cat, did you see the badge?`
- `Хувере, будь ласка, допоможи.`
- `Хуверчику, ти не бачив бейдж?`

Fixel is the brown cat sleeping above or near the stage. Fixel's badge edge
appears only after Hoover points to Fixel. Fixel reveals the badge code only
after a plausible waking attempt. The waking action does not need to be gentle.
Fixel should not answer with words; if addressed, his audible response is limited
to purring, sleepy grumbling, or similar nonverbal cat sounds.

Acceptable Fixel waking examples include:

- `Fixel, wake up.`
- `Hey Fixel, wake up.`
- `Boo, Fixel!`
- `Фіксель, прокидайся.`
- `Гей, Фіксель, вставай.`
- `Бу, Фіксель!`

## Direction

- Build a small, playable product rather than a broad platform.
- Prefer an interaction where voice, narration, audio generation, or
  conversational behavior is central enough that ElevenLabs is not just a
  decorative integration.
- Treat voice as the only intended player input. Do not expose command buttons,
  typed command forms, progress panels, or dashboard controls in the main quest
  UI.
- Support Ukrainian and English voice play through automatic per-turn language
  detection, not a manual in-room language selector.
- Keep microphone control copy compact: `Push to talk` may remain fixed English,
  while the nearby hint should tell players that English and Ukrainian are both
  valid and that sound should be on.
- Make the first screen a fullscreen illustrated room. Any microphone affordance
  or transcript indicator must be minimal and integrated into the scene.
- Prioritize visual fidelity to the MacPaw Space reference before adding visible
  gameplay UI.
- A leaderboard affordance may exist as a small neutral control integrated into
  the left presentation screen. It should switch that screen into recent
  completions, and after quest completion it may open automatically into name
  entry and the leaderboard result. It must not use the puzzle code as a label
  and must not become a permanent sidebar or dashboard.
- Optimize for local iteration and a stable cloud path when the product needs
  persistence, external callbacks, or shareable access.
- Treat persistent user-facing features, such as leaderboard entries after quest
  completion, as durable product capabilities rather than throwaway demo state.
- Preserve decisions in docs when they affect future implementation.

## Target User

Assume a casual player or project reviewer who needs to understand within the
first few seconds that the product listens, reacts, talks back, and lets voice
drive progress through a room.

## Non-Goals

- No heavy architecture before the product need is clear.
- No permanent product claims hidden only in work plans.
- No integration with external services without clear product value.
- No chatbot-only experience where voice merely reads static text.
- No complex inventory, map, scoring system, or long puzzle chain until the core
  quest loop is strong.
- No visible mock command buttons or manual text input in the main quest
  experience.
- No visible language selector in the main quest experience.
- No persistent side panels, logs, readiness boards, or progress dashboards on
  the primary game screen.
