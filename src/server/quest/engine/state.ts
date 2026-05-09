import type { QuestState } from "../../../shared/voice.js";

export type { QuestState };

export const initialQuestState: QuestState = {
  danDoorChecked: false,
  hooverClueGiven: false,
  codeRevealed: false,
  doorOpen: false,
};

export function normalizeQuestState(
  state: Partial<QuestState> | null | undefined = {},
): QuestState {
  const source = state && typeof state === "object" ? state : {};
  const danDoorChecked = source.danDoorChecked === true;
  const hooverClueGiven = source.hooverClueGiven === true && danDoorChecked;
  const codeRevealed = source.codeRevealed === true && hooverClueGiven;
  const doorOpen = source.doorOpen === true && codeRevealed;

  return {
    danDoorChecked,
    hooverClueGiven,
    codeRevealed,
    doorOpen,
  };
}
