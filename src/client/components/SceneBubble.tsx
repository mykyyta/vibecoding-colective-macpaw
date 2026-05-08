import type { QuestLanguage } from "../../shared/voice";
import { getListeningBubble } from "../quest/bubbles";
import type { RoomState, SceneBubbleContent } from "../types/scene";

export default function SceneBubble({
  bubble,
  roomState,
  voiceLanguage,
}: {
  bubble: SceneBubbleContent | null;
  roomState: RoomState;
  voiceLanguage: QuestLanguage;
}) {
  const content = bubble ?? getListeningBubble(roomState, voiceLanguage);

  if (!content) {
    return null;
  }

  return (
    <div className={`speech-bubble speech-bubble--${content.actor}`} aria-live="polite">
      <span>{content.name}</span>
      <strong>{content.text}</strong>
    </div>
  );
}
