import type { QuestActor, QuestLanguage, QuestState } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";
import type { RoomState, SceneBubbleContent } from "../types/scene";

export function getBubbleForVoiceTurn(
  actor: QuestActor,
  reply: string,
  questState: QuestState,
  language: QuestLanguage,
): SceneBubbleContent {
  const copy = VOICE_COPY[language];

  switch (actor) {
    case "dan":
      return {
        actor: "dan",
        name: "Dan",
        text: reply,
      };
    case "hoover":
      return {
        actor: "hoover",
        name: "Hoover",
        text: reply,
      };
    case "fixel":
      return {
        actor: "fixel",
        name: "Fixel",
        text: reply,
      };
    case "sofia":
      return {
        actor: "sofia",
        name: copy.sofiaName,
        text: reply,
      };
    case "system":
      return {
        actor: "room",
        name: copy.roomName,
        text: reply,
      };
  }
}

export function getListeningBubble(
  state: RoomState,
  language: QuestLanguage,
): SceneBubbleContent | null {
  if (state === "listening") {
    const copy = VOICE_COPY[language];

    return {
      actor: "room",
      name: copy.microphoneName,
      text: copy.listening,
    };
  }

  return null;
}

export function getAmbientHint(
  questState: QuestState,
  roomState: RoomState,
  language: QuestLanguage,
): string {
  const copy = VOICE_COPY[language];

  if (roomState === "listening") {
    return copy.ambientListening;
  }

  if (roomState === "doorOpening") {
    return copy.ambientDoorOpening;
  }

  if (questState.doorOpen) {
    return copy.ambientEscaped;
  }

  if (questState.codeRevealed) {
    return copy.ambientCodeRevealed;
  }

  if (questState.hooverClueGiven || questState.codeRevealed) {
    return copy.ambientFixelStage;
  }

  if (questState.danBadgeAsked) {
    return copy.ambientHooverClue;
  }

  return copy.ambientInitial;
}
