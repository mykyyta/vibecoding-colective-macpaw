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
    getDecisionGuideBlock(),
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
    return "the door is open; only short organizer follow-up remains";
  }

  if (state.codeRevealed) {
    return "the badge code is visible; Dan is the only actor who can enter it";
  }

  if (state.hooverClueGiven) {
    return "Hoover revealed that Fixel took the badge; Fixel is sleeping on it";
  }

  if (state.danBadgeAsked) {
    return "Dan admitted he cannot find the badge and mentioned Hoover, the white cat";
  }

  if (state.danExplainedDoor) {
    return "Dan says he has the badge and is still searching his pockets";
  }

  return "Sofiia has introduced the room; Dan is available near the door area";
}

function getVisibleCharacterSummary(state: QuestState): string {
  const visible = [
    "Sofiia, event organizer",
    "Dan, event organizer near the door area",
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

function getDecisionGuideBlock(): string {
  return [
    "[Decision guide for this turn]",
    "- First decide whether the player's transcript clearly satisfies a legal",
    "  progression transition from the allowed list. If not, choose",
    "  chitchat-replied.",
    "- Ordinary greetings, reactions, jokes, comments, acknowledgments, vague",
    "  sounds, and non-help remarks are chitchat-replied, not hints.",
    "- A bare character name or greeting, such as 'Софія', 'Ден', 'Hoover',",
    "  'hi Dan', or 'Дене привіт', is chitchat unless the same transcript",
    "  clearly contains a legal progression intent.",
    "- Choose sofia-hint-given when the player is asking for what to do,",
    "  asking for a hint/advice/direction/next step, or clearly says they",
    "  are stuck or do not understand how to continue.",
    "  Hint examples: 'що мені робити?', 'що нам робити?', 'що далі?',",
    "  'я не знаю що робити', 'я не розумію що далі', 'підштовхни мене',",
    "  'натякни', 'what should I do?', 'what do we do now?',",
    "  'I'm stuck', 'give me a hint'.",
    "- Do NOT choose sofia-hint-given for ordinary conversation: greetings,",
    "  thanks, jokes, compliments, emotional reactions, comments about the",
    "  event/room/characters, or a direct Sofiia address without a request",
    "  for help. Those are chitchat-replied with actor=sofia.",
    "  Non-hint examples: 'Софія', 'привіт', 'дякую', 'класний івент',",
    "  'ти тут?', 'як справи?', 'що це за місце?', 'nice event'.",
    "- For Sofiia chitchat, answer the player's actual phrase with one fresh,",
    "  warm in-scene comment. Do not provide the next puzzle action.",
    "- When the current stage is about Hoover or Fixel and the player's attempt",
    "  does not legally trigger that cat, Sofiia should still respond with a",
    "  fresh stage-aware comment, not a generic fallback. She can acknowledge",
    "  that Hoover is being selective, or that Fixel remains deeply asleep,",
    "  without naming the exact missing trigger unless the player asked for a",
    "  hint.",
    "  Hoover-stage examples that should be Sofiia chitchat when they do not",
    "  clearly address Hoover affectionately: 'ну давай будь ласка',",
    "  'please', 'ну що', unclear fragments, or general pleading.",
    "  Fixel-stage examples that should be Sofiia chitchat when Fixel is not",
    "  clearly addressed or no food is offered: 'прокидайся вже', 'wake up',",
    "  'ну давай', unclear fragments, or general noise.",
    "  In these cases, mention the current stage mood in new words and react",
    "  to the player's attempt; do not reuse fallback lines like a script.",
    "  Do not use imperative or suggestion wording such as 'спробуй',",
    "  'звернись', 'може', 'try', 'ask', or 'maybe'. Do not name the missing",
    "  trigger (gentler address, cat affection, food, treat, snack) unless the",
    "  player explicitly asked for a hint.",
    "  The reply must be a closed observation, not a question and not a",
    "  suggestion. End it as a statement. Bad shape: 'Може, варто...?'",
    "  or 'Спробуй...'. Good shape: a short comment that the cat is unmoved,",
    "  selective, sleepy, theatrical, or unimpressed.",
    "- Sofiia replies must not contain question marks or follow-up questions.",
    "- For Dan chitchat, answer with playful banter. He may mention the visible",
    "  room or door as color, but must not explain the door mechanism, mention",
    "  the badge/code, claim he lost anything, give an exit solution, or say",
    "  what the player should do next unless the chosen transition itself is a",
    "  Dan progression transition.",
    "- Do not copy persona examples, fallback/canned lines, stage summaries,",
    "  or transition descriptions into the reply.",
    "- If unsure between a hint and chitchat, choose chitchat-replied.",
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
