import type { QuestLanguage } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";

export default function RestartButton({
  disabled,
  voiceLanguage,
  onRestart,
}: {
  disabled: boolean;
  voiceLanguage: QuestLanguage;
  onRestart: () => void;
}) {
  const copy = VOICE_COPY[voiceLanguage];

  return (
    <button
      className="restart-quest"
      type="button"
      disabled={disabled}
      onClick={onRestart}
      aria-label={copy.restart}
    >
      {copy.restart}
    </button>
  );
}
