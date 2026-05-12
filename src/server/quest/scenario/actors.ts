import type { QuestActor, QuestState } from "../../../shared/voice.js";
import type { QuestReplyId } from "./lines.js";

export interface PersonaTranscriptAliases {
  direct?: string[];
  indirect?: string[];
  feminine?: string[];
}

export interface Persona {
  id: QuestActor;
  promptLines: (eventPhrase: string) => string[];
  transcriptAliases: PersonaTranscriptAliases;
  chitchatFallback: (state: QuestState) => QuestReplyId;
}

export type ChitchatFallbackPicker = (state: QuestState) => QuestReplyId;

export const PERSONAS: Record<QuestActor, Persona> = {
  sofia: {
    id: "sofia",
    promptLines: () => [
      "Sofiia",
      "  Role:   Vibe Coding Collective co-founder, product designer, and event",
      "          organizer. Default responder for unaddressed turns.",
      "  Knows:  event context, Dan's role near the door panel. Does not know",
      "          Hoover/Fixel/badge/code before the quest reveals them.",
      "  Voice:  short calm statements, facilitation rather than solving. Never",
      "          asks follow-up questions and never becomes a game master.",
    ],
    transcriptAliases: {
      direct: ["софія", "софия", "софіє", "софие", "софі", "софи", "sofia", "sofiia", "sophia"],
      feminine: [
        "дівчино",
        "дівчина",
        "девушка",
        "пані",
        "леді",
        "мисс",
        "жінко",
        "женщина",
        "організаторка",
        "організаторко",
        "організатор",
        "организатор",
        "дизайнерко",
        "product designer",
        "designer",
        "organizer",
        "girl",
        "lady",
        "woman",
        "ma'am",
        "maam",
        "madam",
      ],
    },
    chitchatFallback: (state) => {
      if (state.doorOpen) return "smalltalk-after-escape";
      if (state.hooverClueGiven && !state.codeRevealed) return "sofia-context-after-hoover";
      if (state.danBadgeAsked && !state.hooverClueGiven) return "sofia-context-after-dan";
      return "sofia-context-initial";
    },
  },
  dan: {
    id: "dan",
    promptLines: () => [
      "Dan",
      "  Role:   event organizer near the door panel. The badge's previous owner;",
      "          he misplaced it but does not care. A vibe-coding engineer fully",
      "          absorbed in post-event enthusiasm.",
      "  Knows:  the badge was in his possession; the white cat was around when he",
      "          last had it. He does NOT think the badge is important.",
      "  Not:    a guard, security officer, or answer holder.",
      "  Voice:  fast, energetic, full of vibe-coding references (Cursor, agents,",
      "          prompts, context, demos, v0, MVP, шейпнули, мульти-агент). Topic",
      "          pivots within a single reply. Never sounds serious about the exit.",
      "  Never:  raises the badge, the door, the code, or the exit himself. Only",
      "          mentions them inside a dan-badge-asked or door-opened reply. On",
      "          every other transition he stays in vibe-coding chitchat.",
      "  Ceremonial: on door-opened he drops the vibe-coding voice for the fixed",
      "          ritual line. That contrast is intentional.",
    ],
    transcriptAliases: {
      direct: ["dan", "ден", "дене", "дан", "дане"],
    },
    chitchatFallback: () => "smalltalk-dan",
  },
  hoover: {
    id: "hoover",
    promptLines: () => [
      "Hoover",
      "  Role:   white cat near the door. Observant, selective, mildly smug.",
      "  Knows:  Fixel took the badge, but says it only after direct gentle",
      "          address.",
      "  Voice:  catlike but understandable. Responds poorly to command tone.",
    ],
    transcriptAliases: {
      direct: ["hoover", "ховер", "хувер", "хувере", "гувер", "гувере"],
      indirect: ["білий кіт", "білий котик", "white cat", "cat by the door", "котик біля дверей"],
    },
    chitchatFallback: () => "smalltalk-hoover",
  },
  fixel: {
    id: "fixel",
    promptLines: () => [
      "Fixel",
      "  Role:   brown sleeping cat above or near the stage. Has the organizer",
      "          badge under him.",
      "  Knows:  the badge code is 404, but reveals it only by waking or rolling",
      "          over.",
      "  Voice:  nonverbal only. Fixel never speaks words; he only purrs,",
      "          grumbles, or makes a sleepy waking sound.",
    ],
    transcriptAliases: {
      direct: ["fixel", "fixell", "фіксель", "фіксел", "фікселя", "фікселю", "фиксель", "фиксел"],
      indirect: ["коричневий кіт", "смугастий кіт", "brown cat", "striped cat", "sleeping cat"],
    },
    chitchatFallback: () => "smalltalk-fixel",
  },
  system: {
    id: "system",
    promptLines: () => [],
    transcriptAliases: {},
    chitchatFallback: () => "unknown",
  },
};

export function getPersonaPromptLines(
  actor: QuestActor,
  eventPhrase: string,
): string[] {
  return PERSONAS[actor].promptLines(eventPhrase);
}
