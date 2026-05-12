import type { QuestState, VoiceTurnResponse } from "../../shared/voice";
import type { RoomState } from "../types/scene";

export const initialQuestState: QuestState = {
  danBadgeAsked: false,
  hooverClueGiven: false,
  codeRevealed: false,
  doorOpen: false,
};

export function getRoomStateForVoiceTurn(response: VoiceTurnResponse): RoomState {
  switch (response.event.type) {
    case "door-opened":
      return "doorOpening";
    case "code-revealed":
      return "codeRevealed";
    case "hoover-ordinary-rejected":
    case "fixel-sleeping-rejected":
      return "catRejected";
    case "hoover-clue-given":
    case "dan-badge-asked":
      return "danBadgeAsked";
    case "chitchat-replied":
    case "sofia-hint-given":
      return mapQuestStateToRoomState(response.nextQuestState);
  }
}

export function mapQuestStateToRoomState(questState: QuestState): RoomState {
  if (questState.doorOpen) {
    return "escaped";
  }

  if (questState.codeRevealed) {
    return "codeRevealed";
  }

  if (questState.hooverClueGiven) {
    return "catRejected";
  }

  if (questState.danBadgeAsked) {
    return "danBadgeAsked";
  }

  return "idle";
}
