export {
  FINAL_DAN_LINES,
  CANNED_REPLIES,
  FINAL_DOOR_LINE,
  getQuestReply,
  getFinalDoorLine,
  type QuestReplyId,
} from "./lines.js";

export {
  PERSONAS,
  getPersonaPromptLines,
  type Persona,
  type PersonaTranscriptAliases,
  type ChitchatFallbackPicker,
} from "./actors.js";

export { getStoryHeader, getSceneDescription } from "./story.js";
export { getHardRulesBlock } from "./rules.js";
export { getStyleBlock } from "./style.js";
export { getRoutingContractBlock } from "./routing.js";
export {
  DOOR_ALIASES,
  CODE_ALIASES,
  CODE_INTENT_ALIASES,
  GENTLE_ALIASES,
  HINT_INTENT_ALIASES,
  VCC_ALIASES,
  SMALLTALK_ALIASES,
  FOOD_OFFER_ALIASES,
} from "./aliases.js";

export {
  MOVE_SCENARIO_DATA,
  type MoveScenarioData,
} from "./moves.js";

export {
  SOFIA_HINT_STAGES,
  getSofiaHintStageForState,
  getSofiaHintReplyId,
  getSofiaHintStageContext,
  type SofiaHintStage,
} from "./hints.js";

export { SECRETS, type SecretFact } from "./secrets.js";
