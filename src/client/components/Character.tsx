import type { QuestLanguage } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";
import type { RoomState } from "../types/scene";

export default function Character({
  actor,
  mood = "idle",
  roomState,
  voiceLanguage,
  badgeEdgeVisible = false,
  badgeCodeVisible = false,
}: {
  actor: "dan" | "hoover" | "fixel" | "sofia";
  mood?: "idle" | "ignored" | "helpful";
  roomState: RoomState;
  voiceLanguage: QuestLanguage;
  badgeEdgeVisible?: boolean;
  badgeCodeVisible?: boolean;
}) {
  const copy = VOICE_COPY[voiceLanguage];

  if (actor === "hoover") {
    return (
      <div className={`hoover hoover-cat hoover-cat--${mood}`} aria-label={copy.hooverAria}>
        <span className="hoover-cat-shadow" />
        <span className="hoover-cat-tail" />
        <span className="hoover-cat-body" />
        <span className="hoover-cat-head">
          <i className="hoover-cat-ear hoover-cat-ear--left" />
          <i className="hoover-cat-ear hoover-cat-ear--right" />
          <i className="hoover-cat-eye hoover-cat-eye--left" />
          <i className="hoover-cat-eye hoover-cat-eye--right" />
          <i className="hoover-cat-nose" />
        </span>
      </div>
    );
  }

  if (actor === "fixel") {
    return (
      <div
        className={`fixel screen-rim-cat ${
          badgeEdgeVisible ? "fixel--badge-edge" : ""
        } ${badgeCodeVisible ? "fixel--badge-code" : ""}`}
        aria-label={copy.fixelAria}
      >
        <span className="fixel-badge" aria-hidden="true">
          <i>{badgeCodeVisible ? "404" : ""}</i>
        </span>
        <span className="screen-rim-cat__shadow" />
        <span className="screen-rim-cat__tail" />
        <span className="screen-rim-cat__body" />
        <span className="screen-rim-cat__head">
          <i className="screen-rim-cat__ear screen-rim-cat__ear--left" />
          <i className="screen-rim-cat__ear screen-rim-cat__ear--right" />
          <i className="screen-rim-cat__face" />
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
    roomState === "danDoorChecked" ||
    roomState === "doorOpening" ||
    roomState === "escaped";

  return (
    <div
      className={`dan dan-figure ${isSpeaking ? "dan-figure--speaking" : ""}`}
      aria-label={copy.danAria}
    >
      <span className="dan-figure-shadow" />
      <span className="dan-figure-legs" />
      <span className="dan-figure-body">
        <i className="dan-figure-shirt" />
      </span>
      <span className="dan-figure-head">
        <i className="dan-figure-hair dan-figure-hair--back" />
        <i className="dan-figure-beard" />
        <i className="dan-figure-face" />
        <i className="dan-figure-hair dan-figure-hair--left" />
        <i className="dan-figure-hair dan-figure-hair--right" />
        <i className="dan-figure-hair dan-figure-hair--crown" />
      </span>
      <span className="dan-figure-arm" />
    </div>
  );
}
