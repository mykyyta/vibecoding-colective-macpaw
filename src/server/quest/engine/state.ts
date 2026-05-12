import type { QuestState } from "../../../shared/voice.js";

export type { QuestState };

export const initialQuestState: QuestState = {
  danBadgeAsked: false,
  hooverClueGiven: false,
  codeRevealed: false,
  doorOpen: false,
};

export function normalizeQuestState(
  state: Partial<QuestState> | null | undefined = {},
): QuestState {
  const source = state && typeof state === "object" ? state : {};
  const danBadgeAsked = source.danBadgeAsked === true;
  const hooverClueGiven = source.hooverClueGiven === true && danBadgeAsked;
  const codeRevealed = source.codeRevealed === true && hooverClueGiven;
  const doorOpen = source.doorOpen === true && codeRevealed;

  return {
    danBadgeAsked,
    hooverClueGiven,
    codeRevealed,
    doorOpen,
  };
}
