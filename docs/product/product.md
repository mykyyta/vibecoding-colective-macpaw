---
last_updated: 2026-05-14
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
panel, and the user must find a way out by speaking with the Vibecoding
Collective hosts and the resident MacPaw Space cats.

There is no guard. There is no room or door voice. The interactive cast is:

- **Sofiia**: Vibe Coding Collective co-founder, product designer, and event
  organizer who is hosting the event in MacPaw Space, not office staff. She is
  the default responder for unaddressed turns.
- **Dan**: Vibe Coding Collective co-founder and event organizer who can inspect
  the door panel and enter the code once the player finds it.
- **Hoover**: the resident MacPaw Space white office cat near the door or exit
  area. Hoover knows that Fixel took the badge, but only reveals that clue after
  the player addresses Hoover directly and gently.
- **Fixel**: the resident MacPaw Space brown office cat sleeping above or near
  the stage. Fixel has the organizer badge under him. Fixel does not speak in
  words; after a plausible food or edible mention addressed to him he only
  purrs, grumbles, or makes a sleepy cat sound while the visual state reveals
  the badge code.

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

1. The user speaks their first line of the session. Regardless of what they
   say or whom they address, Sofiia takes the floor and introduces herself
   and Dan, says the door is locked, and mentions that Dan had a badge with
   the code but somehow misplaced it. The Sofiia and Dan name tags appear.
2. The user addresses Dan and asks about the door, exit, code, or badge.
   Dan confirms the door needs a badge, claims he has it on him, and
   starts looking ("just a second, almost got it"). He does not admit
   losing it and does not mention the cat.
3. The user keeps asking Dan about the badge. Dan stays in the stall
   loop, repeating fresh variations of "I have it, give me a second".
   The loop has no turn limit.
4. The user breaks the loop by suggesting Dan lost the badge ("maybe
   you lost it?", "може ти його загубив?"). Only on that explicit
   loss-suggestion does Dan finally admit he can't find it and
   casually mention that the white cat Hoover was hanging around him.
   The Hoover name tag appears.
5. The user addresses Hoover directly. Hoover does not progress the quest
   unless the user addresses him gently; pre-activation Hoover addresses
   route to Sofiia.
6. When addressed gently, Hoover says that Fixel took the badge. The Fixel
   name tag appears, and a badge edge appears under Fixel while the code
   remains hidden.
7. The user addresses Fixel. Fixel sleeps with his head resting on the
   badge. Loud wake attempts ("прокидайся", "hey", "boo") are ignored —
   he does not respond to noise. Pre-activation Fixel addresses route to
   Sofiia.
8. The user addresses Fixel and mentions food or any edible thing near that
   address ("хочеш ласощів?", "корм", "віскас", "цукерочка", "treat",
   "cat food", "candy", "fish", etc). This may be an offer, a question, or a
   comment about food. Fixel raises his head, opens his eyes, the badge that
   was under his head falls and dangles on its lanyard, and code `404` becomes
   visible. Fixel's reply is a single nonverbal "мррп.".
9. The user tells code `404` to Dan.
10. Dan drops vibe-coding mode for a playful congratulation:
   `Ти зміг. Хувер і Фіксель, здається, тепер у твоєму фан-клубі.` /
   `You did it. Hoover and Fixel may now be in your fan club.`

This ending should feel like a warm playful congratulation, not a guard
granting escape or a formal event closing.

Character activation is strictly sequential and made visible by name tags:
Sofiia and Dan after the intro fires, Hoover after `dan-badge-asked`, Fixel
after `hoover-clue-given`. A name tag over a character means the user can
address them.

Core line:

> The room does not just listen for commands; it listens for who the user is
> speaking to and how they perform the voice interaction.

## Character Rules

Sofiia is the warm, optimistic presence in the room. She knows about the
badge and that Dan was its previous owner from the start, and she frames the
problem in her intro. She is the default responder for unaddressed turns, but
ordinary chitchat should be ambient commentary rather than direct next-step
guidance. She must not mention Hoover, Fixel, the badge's current location,
or code `404` before the player reaches those facts through the quest path.

Sofiia gives direct hints only when the player explicitly asks for a hint,
idea, help, advice, direction, or next step, or clearly says they are stuck
or do not know what to do. The help request does not need to address Sofiia
by name because unaddressed turns default to her. She should sound like a
warm event organizer who trusts the player completely and never sounds tired
or impatient. She should not become a game master, narrator, answer key, or
generic chatbot, and she does not ask follow-up questions.

Dan is a Vibe Coding Collective co-founder, event organizer, and vibe-coding
engineer who is still riding the after-event high. He had the badge with the
code and misplaced it, but does not think it matters. Outside `dan-badge-asked`
and `door-opened`, he should answer what the player actually said with cheerful
irony or playful banter.
He may casually mention the visible door or door area as scene color, but
must not explain the lock, mention the badge/code, claim he lost anything,
give an exit solution, or tell the player what to do next. Tech, AI, Cursor,
agents, prompts, demos, deploys, or debugging jokes are allowed when they fit
the moment, but they are optional seasoning rather than a fixed template.
When the player asks him directly about the badge or how to leave, he briefly
mentions the white cat and then stays playful without revealing extra facts.
On the final `door-opened` turn he delivers the fixed congratulation line.

Hoover is the resident MacPaw Space white office cat near the door. Hoover
reveals the Fixel clue only after an affectionate Hoover, white-cat, or
cat-addressed turn. A perfect transcript of Hoover's proper name should not be
required after Dan has pointed to the white cat, but bare politeness alone is
not enough. `Хувере, будь ласка` or `please, Hoover` should be treated as
ordinary, not affectionate. On ordinary or insufficiently affectionate
addresses, Hoover should answer with dry catlike irony that hints he wants a
gentler tone without turning into an explicit tutorial. Backend state gates
must still prevent early progression.

Acceptable Hoover affection examples include:

- `Hoover, sweet kitty, did you see the badge?`
- `Good kitty, did you see anything?`
- `Хуверчику, ти не бачив бейдж?`
- `Котику-муркотунчику, допоможи.`

Fixel is the resident MacPaw Space brown office cat sleeping above or near the
stage. Fixel's badge edge appears only after Hoover points to Fixel. Fixel
reveals the badge code only after a direct Fixel address that mentions food or
any edible thing. Loud waking attempts do not reveal the code. Fixel should not
answer with words; if addressed, his audible response is limited to purring,
sleepy grumbling, or similar nonverbal cat sounds.

Acceptable Fixel code-reveal examples include:

- `Фіксель, хочеш ласощів?`
- `Фіксель, як тобі ця цукерочка?`
- `Фіксель, корм віскас.`
- `Fixel, want a treat?`
- `Fixel, how about some cat food?`
- `Fixel, candy?`

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
