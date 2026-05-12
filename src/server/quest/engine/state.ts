import type { QuestState } from "../../../shared/voice.js";

export type { QuestState };

export const initialQuestState: QuestState = {
  sofiaIntroduced: false,
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
  const danBadgeAsked = source.danBadgeAsked === true && sofiaIntroduced;
  const hooverClueGiven = source.hooverClueGiven === true && danBadgeAsked;
  const codeRevealed = source.codeRevealed === true && hooverClueGiven;
  const doorOpen = source.doorOpen === true && codeRevealed;

  return {
    sofiaIntroduced,
    danBadgeAsked,
    hooverClueGiven,
    codeRevealed,
    doorOpen,
  };
}
