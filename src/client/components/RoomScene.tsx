import type { QuestLanguage, QuestState } from "../../shared/voice";
import { EVENT_BANNER_URL } from "../config/assets";
import { VOICE_COPY } from "../copy/voice-copy";
import type { RoomState, SceneBubbleContent } from "../types/scene";
import Character from "./Character";
import FinalFireworks from "./FinalFireworks";
import LeaderboardScreen from "./LeaderboardScreen";
import type { LeaderboardScreenProps } from "./LeaderboardScreen";
import SceneBubble from "./SceneBubble";

export default function RoomScene({
  bubble,
  leaderboard,
  questState,
  roomState,
  voiceLanguage,
}: {
  bubble: SceneBubbleContent | null;
  leaderboard: LeaderboardScreenProps;
  questState: QuestState;
  roomState: RoomState;
  voiceLanguage: QuestLanguage;
}) {
  const doorOpen = roomState === "doorOpening" || roomState === "escaped";
  const pixelMood =
    roomState === "catIgnored"
      ? "ignored"
      : roomState === "codeRevealed" ||
          roomState === "doorOpening" ||
          roomState === "escaped"
        ? "helpful"
        : "idle";

  return (
    <section
      className={`room-scene ${leaderboard.isOpen ? "room-scene--leaderboard" : ""}`}
      aria-label={VOICE_COPY[voiceLanguage].roomSceneAria}
    >
      <div className="room-shell" aria-hidden="true">
        <div className="back-wall" />
        <div className="left-presentation-wall" />
        <div className="right-wood-wall" />
        <div className="ceiling-plane" />
        <div className="floor-plane" />
      </div>

      <div className="ceiling-fixtures" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="wood-columns" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div
        className={`presentation-wall ${
          leaderboard.isOpen ? "presentation-wall--leaderboard" : ""
        }`}
      >
        <div
          className="stage-event-banner-frame"
          aria-hidden={leaderboard.isOpen}
        >
          <img
            className="stage-event-banner"
            src={EVENT_BANNER_URL}
            alt="Vibecoding Collective event banner"
          />
        </div>
        <div className="screen-rim-cat" aria-hidden="true">
          <span className="screen-rim-cat__shadow" />
          <span className="screen-rim-cat__tail" />
          <span className="screen-rim-cat__body" />
          <span className="screen-rim-cat__head">
            <i className="screen-rim-cat__ear screen-rim-cat__ear--left" />
            <i className="screen-rim-cat__ear screen-rim-cat__ear--right" />
            <i className="screen-rim-cat__face" />
          </span>
        </div>
        <div className="screen-sheen" aria-hidden="true" />
        <div className="stage-success" aria-hidden="true">
          <span>EXIT RESOLVED</span>
        </div>
        <LeaderboardScreen {...leaderboard} voiceLanguage={voiceLanguage} />
      </div>
      <div className="back-signage" aria-hidden="true">
        <span>Exit MacPaw Space</span>
      </div>

      <div className="led-rails" aria-hidden="true">
        <span className="led-rail led-rail--ceiling" />
        <span className="led-rail led-rail--wall" />
        <span className="led-rail led-rail--steps" />
      </div>

      <div className="stepped-seating" aria-hidden="true">
        <span className="seat-row seat-row--top" />
        <span className="seat-row seat-row--middle" />
        <span className="seat-row seat-row--front" />
        <span className="seat-face seat-face--top" />
        <span className="seat-face seat-face--middle" />
        <span className="seat-face seat-face--front" />
      </div>

      <div className="exit-zone">
        <div className={`door-light ${doorOpen ? "door-light--open" : ""}`} />
        <div className={`exit-door ${doorOpen ? "exit-door--open" : ""}`}>
          <span className="door-sign">EXIT</span>
          <span className="door-handle" />
        </div>
        <div
          className={`keypad ${roomState === "codeRevealed" ? "keypad--ready" : ""} ${
            doorOpen ? "keypad--accepted" : ""
          }`}
          aria-label={VOICE_COPY[voiceLanguage].exitKeypadAria}
        >
          <span>{doorOpen || roomState === "codeRevealed" ? "404" : ""}</span>
        </div>
      </div>

      <Character actor="sofia" roomState={roomState} voiceLanguage={voiceLanguage} />
      <Character actor="guard" roomState={roomState} voiceLanguage={voiceLanguage} />
      <Character
        actor="pixel"
        mood={pixelMood}
        roomState={roomState}
        voiceLanguage={voiceLanguage}
      />

      <FinalFireworks />
      <SceneBubble
        bubble={bubble}
        roomState={roomState}
        voiceLanguage={voiceLanguage}
      />
    </section>
  );
}
