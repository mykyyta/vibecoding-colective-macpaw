import type { QuestLanguage } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";
import type { RoomState } from "../types/scene";

export default function Character({
  actor,
  mood = "idle",
  roomState,
  voiceLanguage,
}: {
  actor: "guard" | "pixel" | "sofia";
  mood?: "idle" | "ignored" | "helpful";
  roomState: RoomState;
  voiceLanguage: QuestLanguage;
}) {
  const copy = VOICE_COPY[voiceLanguage];

  if (actor === "pixel") {
    return (
      <div className={`pixel pixel--${mood}`} aria-label={copy.pixelAria}>
        <span className="pixel-shadow" />
        <span className="pixel-tail" />
        <span className="pixel-body" />
        <span className="pixel-head">
          <i className="pixel-ear pixel-ear--left" />
          <i className="pixel-ear pixel-ear--right" />
          <i className="pixel-eye pixel-eye--left" />
          <i className="pixel-eye pixel-eye--right" />
        </span>
      </div>
    );
  }

  if (actor === "sofia") {
    return (
      <div className="sofia" aria-label={copy.sofiaAria}>
        <span className="sofia-shadow" />
        <span className="sofia-legs" />
        <span className="sofia-skirt" />
        <span className="sofia-shirt" />
        <span className="sofia-collar" />
        <span className="sofia-sleeve sofia-sleeve--left" />
        <span className="sofia-sleeve sofia-sleeve--right" />
        <span className="sofia-hand sofia-hand--left" />
        <span className="sofia-hand sofia-hand--right" />
        <span className="sofia-head">
          <i className="sofia-hair sofia-hair--back" />
          <i className="sofia-hair sofia-hair--crown" />
          <i className="sofia-hair sofia-hair--left" />
          <i className="sofia-hair sofia-hair--right" />
          <i className="sofia-face" />
          <i className="sofia-glasses" />
        </span>
      </div>
    );
  }

  const isSpeaking =
    roomState === "guardHintGiven" ||
    roomState === "doorOpening" ||
    roomState === "escaped";

  return (
    <div
      className={`guard ${isSpeaking ? "guard--speaking" : ""}`}
      aria-label={copy.guardAria}
    >
      <span className="guard-shadow" />
      <span className="guard-legs" />
      <span className="guard-body" />
      <span className="guard-head">
        <i className="guard-cap" />
        <i className="guard-face" />
      </span>
      <span className="guard-arm" />
    </div>
  );
}
