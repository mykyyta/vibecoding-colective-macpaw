import type { QuestState, VoiceTurnResponse } from "../../shared/voice";
import type { RoomState } from "../types/scene";

export const initialQuestState: QuestState = {
  olegNameKnown: false,
  guardHintGiven: false,
  pixelAddressed: false,
  pixelRejectedOrdinaryCommand: false,
  codeRevealed: false,
  doorOpen: false,
  escaped: false,
};

export function getRoomStateForVoiceTurn(response: VoiceTurnResponse): RoomState {
  switch (response.event.type) {
    case "door-opened":
      return "doorOpening";
    case "code-revealed":
      return "codeRevealed";
    case "pixel-ordinary-rejected":
      return "catIgnored";
    case "guard-hint-given":
    case "oleg-name-learned":
      return "guardHintGiven";
    case "chitchat-replied":
    case "sofia-hint-given":
      return mapQuestStateToRoomState(response.nextQuestState);
  }
}

export function mapQuestStateToRoomState(questState: QuestState): RoomState {
  if (questState.escaped || questState.doorOpen) {
    return "escaped";
  }

  if (questState.codeRevealed) {
    return "codeRevealed";
  }

  if (questState.pixelRejectedOrdinaryCommand) {
    return "catIgnored";
  }

  if (questState.guardHintGiven || questState.olegNameKnown) {
    return "guardHintGiven";
  }

  return "idle";
}
