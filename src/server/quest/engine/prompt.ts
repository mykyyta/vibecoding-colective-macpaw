import type { QuestActor, QuestEventType, QuestLanguage, QuestState } from "../../../shared/voice.js";
import type { TextGenerationContentBlock } from "../../providers/contracts.js";
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

const STABLE_EVENT_PHRASE = "vibecoding event / вайбкодінг івент";
const STABLE_AI_PHRASE = "AI / штучний інтелект";

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
  return buildQuestBrainPromptContent({
    transcript,
    questState,
    allowedTransitions,
    replyLanguage,
  })
    .map((block) => block.text)
    .join("\n\n");
}

export function buildQuestBrainPromptContent({
  transcript,
  questState,
  allowedTransitions,
  replyLanguage,
}: {
  transcript: string;
  questState: QuestState;
  allowedTransitions: AllowedQuestTransition[];
  replyLanguage: QuestLanguage;
}): TextGenerationContentBlock[] {
  return [
    {
      type: "text",
      text: buildStableQuestBrainPrompt(),
      cacheControl: { type: "ephemeral" },
    },
    {
      type: "text",
      text: buildDynamicQuestBrainPrompt({
        transcript,
        questState,
        allowedTransitions,
        replyLanguage,
      }),
    },
  ];
}

function buildStableQuestBrainPrompt(): string {
  return [
    getStoryHeader(STABLE_EVENT_PHRASE, STABLE_AI_PHRASE),
    getOutputFormatBlock(),
    getSceneBlock(),
    getPersonasBlock(STABLE_EVENT_PHRASE),
    getHardRulesBlock(),
    getStyleBlock(STABLE_AI_PHRASE, STABLE_EVENT_PHRASE),
    getRoutingContractBlock(),
  ].join("\n\n");
}

function buildDynamicQuestBrainPrompt({
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

  return [
    getTurnContextBlock({
      replyLanguageLabel,
      visibleCharacterSummary: getVisibleCharacterSummary(questState),
      stageSummary: getQuestStageSummary(questState),
    }),
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

export function getOutputFormatBlock(): string {
  return [
    "[Output format]",
    "Return strict JSON only. No markdown, no code fence, no labels, no commentary.",
    "Schema:",
    "{",
    `  "transitionId": "<one id from allowedTransitions below>",`,
    `  "actor":        "<one allowed actor for that transition>",`,
    `  "reply":        "<player-facing reply in the reply language specified in the dynamic turn context>",`,
    `  "nameTagActors": ["<character ids whose proper names are spoken in the player transcript or reply>"],`,
    `  "confidence":   0.0`,
    "}",
    "The reply is 1-2 short sentences spoken by the chosen actor, in the requested reply language.",
    "Keep proper names verbatim. Do not switch language except for the fixed final door line.",
    "nameTagActors is a visual label decision. Include only these ids: sofia, dan, hoover, fixel.",
    "Include an id only when that character's proper name is explicitly spoken in the player transcript or in your reply. Do not include a character just because they are visible, targeted, or speaking.",
    "Recognize Ukrainian and English name variants: Софія/Sofiia, Ден/Dan, Хувер/Hoover, Фіксель/Fixel.",
    "Respect reveal gates: do not include hoover before Dan has checked the door; do not include fixel before Hoover has revealed the clue.",
  ].join("\n");
}

export function getSceneBlock(): string {
  return [
    "[Scene]",
    ...getSceneDescription(),
  ].join("\n");
}

function getTurnContextBlock({
  replyLanguageLabel,
  visibleCharacterSummary,
  stageSummary,
}: {
  replyLanguageLabel: string;
  visibleCharacterSummary: string;
  stageSummary: string;
}): string {
  return [
    "[Dynamic turn context]",
    `- Reply language for this turn: ${replyLanguageLabel}.`,
    `- Visible characters this turn: ${visibleCharacterSummary}.`,
    `- Current stage: ${stageSummary}.`,
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
