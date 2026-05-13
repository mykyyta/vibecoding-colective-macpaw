import type { QuestLanguage, QuestState } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";
import type { RoomState } from "../types/scene";

export default function AmbientHint({
  voiceLanguage,
}: {
  questState: QuestState;
  roomState: RoomState;
  voiceLanguage: QuestLanguage;
}) {
  const copy = VOICE_COPY[voiceLanguage];

  return (
    <details className="ambient-hint">
      <summary className="ambient-hint__button" aria-label={copy.hintAria}>
        ?
      </summary>
      <span className="ambient-hint__text" aria-live="polite">
        {copy.ambientHint}
      </span>
    </details>
  );
}
