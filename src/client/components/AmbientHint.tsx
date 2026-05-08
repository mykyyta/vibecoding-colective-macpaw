import type { QuestLanguage, QuestState } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";
import { getAmbientHint } from "../quest/bubbles";
import type { RoomState } from "../types/scene";

export default function AmbientHint({
  questState,
  roomState,
  voiceLanguage,
}: {
  questState: QuestState;
  roomState: RoomState;
  voiceLanguage: QuestLanguage;
}) {
  const copy = VOICE_COPY[voiceLanguage];
  const hint = getAmbientHint(questState, roomState, voiceLanguage);

  return (
    <details className="ambient-hint" key={hint}>
      <summary className="ambient-hint__button" aria-label={copy.hintAria}>
        ?
      </summary>
      <span className="ambient-hint__text" aria-live="polite">
        {hint}
      </span>
    </details>
  );
}
