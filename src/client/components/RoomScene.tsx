import type { QuestLanguage, QuestState } from "../../shared/voice";
import { EVENT_BANNER_URL } from "../config/assets";
import { VOICE_COPY } from "../copy/voice-copy";
import type {
  CharacterNameTagState,
  RoomState,
  SceneBubbleContent,
} from "../types/scene";
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
  visibleNameTags,
  voiceLanguage,
}: {
  bubble: SceneBubbleContent | null;
  leaderboard: LeaderboardScreenProps;
  questState: QuestState;
  roomState: RoomState;
  visibleNameTags: CharacterNameTagState;
  voiceLanguage: QuestLanguage;
}) {
  const doorOpen = roomState === "doorOpening" || roomState === "escaped";
  const hooverMood =
    roomState === "catRejected"
      ? "ignored"
      : questState.hooverClueGiven ||
          roomState === "codeRevealed" ||
          roomState === "doorOpening" ||
          roomState === "escaped"
        ? "helpful"
        : "idle";
  const badgeEdgeVisible = questState.hooverClueGiven || questState.codeRevealed;
  const badgeCodeVisible = questState.codeRevealed || questState.doorOpen;

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

      <div className="mac-museum" aria-hidden="true">
        <div className="mac-museum__wall" />
        <div className="mac-museum__shelf mac-museum__shelf--top">
          <span className="museum-mac museum-mac--display">
            <span className="museum-mac__screen" />
            <span className="museum-mac__stem" />
          </span>
          <span className="museum-mac museum-mac--classic">
            <span className="museum-mac__screen" />
            <span className="museum-mac__slot" />
            <span className="museum-mac__badge" />
          </span>
          <span className="museum-mac museum-mac--cube">
            <span className="museum-mac__logo" />
          </span>
          <span className="museum-label" />
        </div>
        <div className="mac-museum__shelf mac-museum__shelf--middle">
          <span className="museum-mac museum-mac--imac">
            <span className="museum-mac__screen" />
            <span className="museum-mac__chin" />
          </span>
          <span className="museum-mac museum-mac--classic museum-mac--small">
            <span className="museum-mac__screen" />
            <span className="museum-mac__slot" />
            <span className="museum-mac__badge" />
          </span>
          <span className="museum-mac museum-mac--laptop">
            <span className="museum-mac__screen" />
            <span className="museum-mac__base" />
          </span>
          <span className="museum-label museum-label--right" />
        </div>
        <div className="mac-museum__shelf mac-museum__shelf--bottom">
          <span className="museum-mac museum-mac--classic museum-mac--stubby">
            <span className="museum-mac__screen" />
            <span className="museum-mac__slot" />
            <span className="museum-mac__badge" />
          </span>
          <span className="museum-mac museum-mac--laptop museum-mac--open">
            <span className="museum-mac__screen" />
            <span className="museum-mac__base" />
          </span>
          <span className="museum-mac museum-mac--imac museum-mac--mini">
            <span className="museum-mac__screen" />
            <span className="museum-mac__chin" />
          </span>
          <span className="museum-label" />
        </div>
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
        <Character
          actor="fixel"
          nameTagVisible={visibleNameTags.fixel}
          roomState={roomState}
          voiceLanguage={voiceLanguage}
          badgeEdgeVisible={badgeEdgeVisible}
          badgeCodeVisible={badgeCodeVisible}
        />
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
          className={`keypad ${questState.codeRevealed ? "keypad--ready" : ""} ${
            doorOpen ? "keypad--accepted" : ""
          }`}
          aria-label={VOICE_COPY[voiceLanguage].exitKeypadAria}
        >
          <span>{doorOpen ? "404" : ""}</span>
        </div>
      </div>

      <Character
        actor="sofia"
        nameTagVisible={visibleNameTags.sofia}
        roomState={roomState}
        voiceLanguage={voiceLanguage}
      />
      <Character
        actor="dan"
        nameTagVisible={visibleNameTags.dan}
        roomState={roomState}
        voiceLanguage={voiceLanguage}
      />
      <Character
        actor="hoover"
        mood={hooverMood}
        nameTagVisible={visibleNameTags.hoover}
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
