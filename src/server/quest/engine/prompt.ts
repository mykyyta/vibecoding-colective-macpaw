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
    return "the player has escaped; only celebratory or ambient follow-up should remain";
  }

  if (state.codeRevealed) {
    return "the code is known; the next useful move is giving code 404 to Oleg";
  }

  if (state.pixelRejectedOrdinaryCommand) {
    return "Pixel rejected ordinary human requests; the next useful move is addressing Pixel with a cat-like sound";
  }

  if (state.guardHintGiven) {
    return "Oleg revealed Pixel as the clue near the exit panel; the next useful move is engaging Pixel";
  }

  if (state.olegNameKnown) {
    return "the guard is known as Oleg; the next useful move is directly asking Oleg about the exit";
  }

  return "the guard's name is not known; the next useful move is learning who the person by the door is";
}

function getVisibleCharacterSummary(state: QuestState): string {
  const visible = [
    "guard near the door",
    "cat nearby",
    "locked door/room",
    "Sofiia in the room",
  ];

  if (state.olegNameKnown) {
    visible[0] = "Oleg, the guard near the door";
  }

  if (state.guardHintGiven) {
    visible[1] = "Pixel, the cat near the exit panel";
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
    `  "confidence":   0.0`,
    "}",
    `The reply is 1-2 short sentences spoken by the chosen actor, in natural ${replyLanguageLabel}.`,
    "Keep proper names verbatim. Do not switch language except for the fixed final door line.",
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
  const actorOrder: QuestActor[] = ["guard", "pixel", "sofia", "door"];
  const sections = actorOrder
    .map((actor) => PERSONAS[actor].promptLines(eventPhrase))
    .filter((lines) => lines.length > 0);

  return ["[Personas]", ...sections.flatMap((lines, i) =>
    i < sections.length - 1 ? [...lines, ""] : lines,
  )].join("\n");
}

