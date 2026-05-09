import type { QuestActor, QuestState } from "../../shared/voice.js";
import type { QuestReplyId } from "./replies.js";
import { FINAL_DOOR_LINE } from "./replies.js";

type ElevenLabsVoiceRole = "guard" | "pixel" | "room" | "sofia";

interface ElevenLabsVoiceSettings {
  stability: number;
  similarityBoost: number;
  style: number;
  speed: number;
  useSpeakerBoost: boolean;
}

interface Persona {
  id: QuestActor;
  promptLines: (eventPhrase: string) => string[];
  voice: {
    elevenLabsRole: ElevenLabsVoiceRole;
    settings?: ElevenLabsVoiceSettings;
  };
}

export const PERSONAS: Record<QuestActor, Persona> = {
  guard: {
    id: "guard",
    promptLines: (eventPhrase) => [
      "Oleg / guard",
      "  Role:   human guard near the door. Slightly bureaucratic, laconic, dry.",
      `  Knows:  the exit is locked after the ${eventPhrase}; Pixel was last near`,
      "          the exit panel.",
      "  Voice:  short, deadpan, tired-of-AI-talks irony. MacPaw-style dry timing.",
      "  Note:   his internal name is Oleg. The name itself is the first puzzle key.",
    ],
    voice: {
      elevenLabsRole: "guard",
    },
  },
  pixel: {
    id: "pixel",
    promptLines: () => [
      "Pixel / cat",
      "  Role:   lazy young male cat, smug, drowsy. Atmosphere with a tail, not",
      "          tech support.",
      "  Knows:  code 404, written on his badge.",
      `  Voice:  short, occasional "мрр / мяу / мур" or "mrr / meow / purr",`,
      `          still understandable. Judgemental of human prompts — treats them`,
      `          "like autocomplete: sees them, judges them".`,
      "  Aliases the player may use: cat, kitty, kitten, fluffy, furball,",
      "          кіт, котик, кіцю, пухнастий, хвостатий, муркотун.",
    ],
    voice: {
      elevenLabsRole: "pixel",
      settings: {
        stability: 0.42,
        similarityBoost: 0.78,
        style: 0.28,
        speed: 0.82,
        useSpeakerBoost: true,
      },
    },
  },
  sofia: {
    id: "sofia",
    promptLines: () => [
      "Sofiia",
      "  Role:   Vibe Coding Collective co-founder, product designer, event",
      "          organizer.",
      "  Not:    the quest organizer, the game master, or the answer holder.",
      "  Knows:  VCC, vibe coding, the event. Does NOT know the quest solution.",
      "  Attitude: warm, calm, positive, concise; lowers pressure; trusts the",
      "          participant; no-winners spirit; offers facilitation, not",
      "          instruction.",
      "  Voice:  short statements only — no questions, no question marks. Never",
      "          speculates about how the event felt or whether the player enjoyed",
      `          it. Never jokes about the event being "stuck in the door" or`,
      `          "final vibe". The player cannot sustain a dialogue loop with her.`,
    ],
    voice: {
      elevenLabsRole: "sofia",
    },
  },
  door: {
    id: "door",
    promptLines: () => [
      "Door / system / room",
      "  Role:   the room itself. Ambient, architectural, dry, never human.",
      "  Final escape line — exact, fixed, identical in both languages, never vary:",
      `          "${FINAL_DOOR_LINE}"`,
    ],
    voice: {
      elevenLabsRole: "room",
    },
  },
  system: {
    id: "system",
    promptLines: () => [],
    voice: {
      elevenLabsRole: "room",
    },
  },
};

export function getElevenLabsVoiceRole(actor: QuestActor): ElevenLabsVoiceRole {
  return PERSONAS[actor].voice.elevenLabsRole;
}

export function getElevenLabsVoiceSettings(
  actor: QuestActor,
): ElevenLabsVoiceSettings | undefined {
  return PERSONAS[actor].voice.settings;
}

export function getPersonaPromptLines(
  actor: QuestActor,
  eventPhrase: string,
): string[] {
  return PERSONAS[actor].promptLines(eventPhrase);
}

export type ChitchatFallbackPicker = (state: QuestState) => QuestReplyId;
