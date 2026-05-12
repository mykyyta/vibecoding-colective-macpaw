import type { QuestState } from "../../../shared/voice.js";

export type { QuestState };

export const initialQuestState: QuestState = {
  sofiaIntroduced: false,
  danExplainedDoor: false,
  danBadgeAsked: false,
  hooverClueGiven: false,
  codeRevealed: false,
  doorOpen: false,
};

export function normalizeQuestState(
  state: Partial<QuestState> | null | undefined = {},
): QuestState {
  const source = state && typeof state === "object" ? state : {};
  const sofiaIntroduced = source.sofiaIntroduced === true;
  const danExplainedDoor = source.danExplainedDoor === true && sofiaIntroduced;
  const danBadgeAsked = source.danBadgeAsked === true && danExplainedDoor;
  const hooverClueGiven = source.hooverClueGiven === true && danBadgeAsked;
  const codeRevealed = source.codeRevealed === true && hooverClueGiven;
  const doorOpen = source.doorOpen === true && codeRevealed;

  return {
    sofiaIntroduced,
    danExplainedDoor,
    danBadgeAsked,
    hooverClueGiven,
    codeRevealed,
    doorOpen,
  };
}
