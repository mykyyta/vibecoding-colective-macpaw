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
    case "guard":
      return {
        actor: "guard",
        name: questState.olegNameKnown ? "Олег" : copy.guardName,
        text: reply,
      };
    case "pixel":
      return {
        actor: "pixel",
        name: "Pixel",
        text: reply,
      };
    case "sofia":
      return {
        actor: "sofia",
        name: copy.sofiaName,
        text: reply,
      };
    case "door":
      return {
        actor: "guard",
        name: copy.doorName,
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

  if (questState.pixelRejectedOrdinaryCommand || questState.codeRevealed) {
    return copy.ambientPixelAddressed;
  }

  if (questState.guardHintGiven) {
    return copy.ambientGuardHintGiven;
  }

  if (questState.olegNameKnown) {
    return copy.ambientOlegKnown;
  }

  return copy.ambientInitial;
}
