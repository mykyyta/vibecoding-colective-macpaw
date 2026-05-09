import type { QuestActor, QuestEventType, QuestLanguage, QuestState } from "../../../shared/voice.js";
import type { AllowedQuestTransition } from "./transitions.js";
import { PERSONAS } from "../scenario/actors.js";
import { getStoryHeader, getSceneDescription } from "../scenario/story.js";
import { getHardRulesBlock } from "../scenario/rules.js";
import { getStyleBlock } from "../scenario/style.js";
import { getRoutingContractBlock } from "../scenario/routing.js";

interface QuestPromptTransition {
  id: QuestEventType;
  actor: QuestActor;
  allowedActors?: QuestActor[];
  stageContext: string;
}

export function buildQuestBrainPrompt({
  transcript,
  questState,
  allowedTransitions,
  replyLanguage,
}: {
  transcript: string;
  questState: QuestState;
  allowedTransitions: AllowedQuestTransition[];
  replyLanguage: QuestLanguage;
}): string {
  const replyLanguageLabel = getReplyLanguageLabel(replyLanguage);
  const eventPhrase =
    replyLanguage === "en" ? "vibecoding event" : "вайбкодінг івент";
  const aiPhrase =
    replyLanguage === "en" ? "AI" : "AI, штучний інтелект";

  return [
    getStoryHeader(eventPhrase, aiPhrase),
    getOutputFormatBlock(replyLanguageLabel),
    getSceneBlock({
      replyLanguageLabel,
      visibleCharacterSummary: getVisibleCharacterSummary(questState),
      stageSummary: getQuestStageSummary(questState),
    }),
    getPersonasBlock(eventPhrase),
    getHardRulesBlock(),
    getStyleBlock(aiPhrase, eventPhrase),
    getRoutingContractBlock(),
    `[Current state]\n${JSON.stringify(questState)}`,
    [
      "[Allowed transitions]",
      "Each card carries the stage-specific guidance you must follow when",
      "selecting it. Do not imitate any example wording inside a description.",
      JSON.stringify(buildQuestPromptTransitions(allowedTransitions), null, 2),
    ].join("\n"),
    `[Player transcript]\n${JSON.stringify(transcript)}`,
  ].join("\n\n");
}

function buildQuestPromptTransitions(
  allowedTransitions: AllowedQuestTransition[],
): QuestPromptTransition[] {
  return allowedTransitions.map((transition) => ({
    id: transition.id,
    actor: transition.actor,
    allowedActors: transition.allowedActors,
    stageContext: transition.description,
  }));
}

function getReplyLanguageLabel(replyLanguage: QuestLanguage): string {
  return replyLanguage === "en" ? "English" : "Ukrainian";
}

function getQuestStageSummary(state: QuestState): string {
  if (state.doorOpen) {
    return "the door is open; only short organizer follow-up should remain";
  }

  if (state.codeRevealed) {
    return "the code is visible; the next useful move is giving code 404 to Dan";
  }

  if (state.hooverClueGiven) {
    return "Hoover revealed that Fixel took the badge; the next useful move is waking Fixel";
  }

  if (state.danDoorChecked) {
    return "Dan checked the code lock and pointed to Hoover; the next useful move is gently addressing Hoover";
  }

  return "the door has not been checked; the next useful move is asking Dan about the door panel";
}

function getVisibleCharacterSummary(state: QuestState): string {
  const visible = [
    "Sofiia, event organizer",
    "Dan near the door panel",
    "Hoover, the white cat near the door",
    "Fixel, the brown sleeping cat above or near the stage",
  ];

  if (state.hooverClueGiven) {
    visible.push("the edge of the organizer badge under Fixel");
  }

  return visible.join("; ");
}

export function getOutputFormatBlock(replyLanguageLabel: string): string {
  return [
    "[Output format]",
    "Return strict JSON only. No markdown, no code fence, no labels, no commentary.",
    "Schema:",
    "{",
    `  "transitionId": "<one id from allowedTransitions below>",`,
    `  "actor":        "<one allowed actor for that transition>",`,
    `  "reply":        "<${replyLanguageLabel} player-facing reply>",`,
    `  "nameTagActors": ["<character ids whose proper names are spoken in the player transcript or reply>"],`,
    `  "confidence":   0.0`,
    "}",
    `The reply is 1-2 short sentences spoken by the chosen actor, in natural ${replyLanguageLabel}.`,
    "Keep proper names verbatim. Do not switch language except for the fixed final door line.",
    "nameTagActors is a visual label decision. Include only these ids: sofia, dan, hoover, fixel.",
    "Include an id only when that character's proper name is explicitly spoken in the player transcript or in your reply. Do not include a character just because they are visible, targeted, or speaking.",
    "Recognize Ukrainian and English name variants: Софія/Sofiia, Ден/Dan, Хувер/Hoover, Фіксель/Fixel.",
    "Respect reveal gates: do not include hoover before Dan has checked the door; do not include fixel before Hoover has revealed the clue.",
  ].join("\n");
}

export function getSceneBlock({
  replyLanguageLabel,
  visibleCharacterSummary,
  stageSummary,
}: {
  replyLanguageLabel: string;
  visibleCharacterSummary: string;
  stageSummary: string;
}): string {
  return [
    "[Scene]",
    ...getSceneDescription(),
    `- Visible characters this turn: ${visibleCharacterSummary}.`,
    `- Current stage: ${stageSummary}.`,
    `- Reply language for this turn: ${replyLanguageLabel}.`,
  ].join("\n");
}

export function getPersonasBlock(eventPhrase: string): string {
  const actorOrder: QuestActor[] = ["sofia", "dan", "hoover", "fixel"];
  const sections = actorOrder
    .map((actor) => PERSONAS[actor].promptLines(eventPhrase))
    .filter((lines) => lines.length > 0);

  return ["[Personas]", ...sections.flatMap((lines, i) =>
    i < sections.length - 1 ? [...lines, ""] : lines,
  )].join("\n");
}
