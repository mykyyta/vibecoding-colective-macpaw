import type {
  LeaderboardCompletionMetrics,
  LeaderboardEntry,
} from "../../shared/leaderboard";
import type { QuestLanguage } from "../../shared/voice";
import { VOICE_COPY } from "../copy/voice-copy";
import { formatDuration, formatRelativeTime } from "../leaderboard/format";

export interface LeaderboardScreenProps {
  completed: boolean;
  completionMetrics: LeaderboardCompletionMetrics | null;
  displayName: string;
  entries: LeaderboardEntry[];
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  message: string;
  onChangeDisplayName: (value: string) => void;
  onClose: () => void;
  onOpen: () => void;
  onSubmit: () => void;
  submittedEntryId: string | null;
  tokenAvailable: boolean;
}

export default function LeaderboardScreen({
  completed,
  completionMetrics,
  displayName,
  entries,
  isLoading,
  isOpen,
  isSubmitting,
  message,
  onChangeDisplayName,
  onClose,
  onOpen,
  onSubmit,
  submittedEntryId,
  tokenAvailable,
  voiceLanguage,
}: LeaderboardScreenProps & { voiceLanguage: QuestLanguage }) {
  const canSubmit =
    completed &&
    tokenAvailable &&
    submittedEntryId === null &&
    displayName.trim().length > 0 &&
    !isSubmitting;
  const copy = VOICE_COPY[voiceLanguage];

  return (
    <>
      <button
        className="screen-board-toggle"
        type="button"
        onClick={isOpen ? onClose : onOpen}
        aria-expanded={isOpen}
        aria-controls="leaderboard-screen"
      >
        <span aria-hidden="true">{isOpen ? "SCN" : "TOP"}</span>
        <strong>
          {isOpen ? copy.leaderboardSceneLabel : copy.leaderboardBoardLabel}
        </strong>
      </button>

      {isOpen ? (
        <section
          className="screen-leaderboard"
          id="leaderboard-screen"
          aria-label={copy.leaderboardAria}
        >
          <div className="screen-leaderboard__head">
            <h2>{copy.leaderboardHeading}</h2>
          </div>

          {completed && submittedEntryId === null ? (
            <form
              className="leaderboard-form"
              onSubmit={(event) => {
                event.preventDefault();
                onSubmit();
              }}
            >
              <p className="leaderboard-form__invite">{copy.leaderboardInvite}</p>
              <label htmlFor="leaderboard-name">{copy.leaderboardNameLabel}</label>
              <div className="leaderboard-form__row">
                <input
                  id="leaderboard-name"
                  type="text"
                  value={displayName}
                  maxLength={32}
                  onChange={(event) => onChangeDisplayName(event.target.value)}
                  disabled={isSubmitting || !tokenAvailable}
                />
                <button type="submit" disabled={!canSubmit}>
                  {isSubmitting ? copy.leaderboardSaving : copy.leaderboardSave}
                </button>
              </div>
              {!tokenAvailable && !message ? (
                <p className="leaderboard-form__unavailable">
                  {copy.leaderboardUnavailable}
                </p>
              ) : null}
              {completionMetrics ? (
                <p>
                  {formatDuration(completionMetrics.durationMs)} ·{" "}
                  {completionMetrics.attempts} {copy.leaderboardTries}
                </p>
              ) : null}
            </form>
          ) : null}

          {message ? <p className="leaderboard-message">{message}</p> : null}

          <ol className="leaderboard-list" aria-busy={isLoading}>
            {isLoading ? (
              <li className="leaderboard-list__placeholder">
                {copy.leaderboardLoading}
              </li>
            ) : entries.length > 0 ? (
              entries.map((entry) => (
                <li
                  key={entry.entryId}
                  className={
                    entry.entryId === submittedEntryId
                      ? "leaderboard-list__item--current"
                      : ""
                  }
                >
                  <span>{entry.displayName}</span>
                  <span className="leaderboard-list__meta">
                    <time dateTime={entry.completedAt}>
                      {formatRelativeTime(entry.completedAt, voiceLanguage)}
                    </time>
                    {entry.durationMs > 0 ? (
                      <strong>{formatDuration(entry.durationMs)}</strong>
                    ) : null}
                  </span>
                </li>
              ))
            ) : (
              <li className="leaderboard-list__placeholder">
                {copy.leaderboardEmpty}
              </li>
            )}
          </ol>
        </section>
      ) : null}
    </>
  );
}
