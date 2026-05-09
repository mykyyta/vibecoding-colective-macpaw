import type { QuestState } from "../../shared/voice.js";

export type { QuestState };

export const initialQuestState: QuestState = {
  olegNameKnown: false,
  guardHintGiven: false,
  pixelRejectedOrdinaryCommand: false,
  codeRevealed: false,
  doorOpen: false,
};

export function normalizeQuestState(
  state: Partial<QuestState> | null | undefined = {},
): QuestState {
  const source = state && typeof state === "object" ? state : {};
  const olegNameKnown = source.olegNameKnown === true;
  const guardHintGiven = source.guardHintGiven === true && olegNameKnown;
  const pixelRejectedOrdinaryCommand =
    source.pixelRejectedOrdinaryCommand === true && guardHintGiven;
  const codeRevealed = source.codeRevealed === true && guardHintGiven;
  const doorOpen = source.doorOpen === true && olegNameKnown && codeRevealed;

  return {
    olegNameKnown,
    guardHintGiven,
    pixelRejectedOrdinaryCommand,
    codeRevealed,
    doorOpen,
  };
}
