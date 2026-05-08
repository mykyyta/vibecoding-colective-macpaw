import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type {
  LeaderboardCompletionMetrics,
  LeaderboardEntry,
} from "../shared/leaderboard";
import type {
  QuestLanguage,
  QuestLanguageInput,
  QuestState,
} from "../shared/voice";
import {
  requestCreateLeaderboardEntry,
  requestLeaderboard,
} from "./api/leaderboard";
import { getFriendlyLeaderboardError } from "./api/errors";
import {
  requestRealtimeSttCapability,
  requestRecordedStt,
  requestVoiceTurn,
} from "./api/voice";
import {
  playTurnReply,
  waitForReplyBusyGate,
} from "./audio/playback";
import { speakWithBrowser } from "./audio/speech-synthesis";
import { stopActiveAudio } from "./audio/state";
import { stopReplyAudioArm, unlockReplyAudio } from "./audio/unlock";
import {
  BROWSER_RECOGNITION_LANGUAGE,
  DEFAULT_QUEST_LANGUAGE,
} from "./config/languages";
import { EVENT_BANNER_URL } from "./config/assets";
import {
  ESCAPE_REWARD_DELAY_MS,
  MIN_RECORDED_STT_BYTES,
  MIN_RECORDED_STT_DURATION_MS,
} from "./config/timing";
import { VOICE_COPY } from "./copy/voice-copy";
import { formatDuration, formatRelativeTime } from "./leaderboard/format";
import {
  getAmbientHint,
  getBubbleForVoiceTurn,
  getListeningBubble,
} from "./quest/bubbles";
import {
  createLanguageInput,
  isReliableLanguageDecision,
} from "./quest/language";
import {
  getRoomStateForVoiceTurn,
  initialQuestState,
  mapQuestStateToRoomState,
} from "./quest/state";
import {
  getSpeechRecognitionConstructor,
  getSupportedRecordingMimeType,
} from "./speech/detection";
import { startElevenLabsRealtimeRecognition } from "./speech/elevenlabs-realtime";
import { observePurrMarkers } from "./speech/purr";
import type {
  BrowserSpeechRecognition,
} from "./types/speech-recognition";
import type {
  RealtimeSpeechRecognizer,
  RecordedSpeechRecognizer,
} from "./types/realtime";
import type { RoomState, SceneBubbleContent } from "./types/scene";

export function App() {
  const [roomState, setRoomState] = useState<RoomState>("idle");
  const [questState, setQuestState] = useState<QuestState>(initialQuestState);
  const [readout, setReadout] = useState("");
  const [bubble, setBubble] = useState<SceneBubbleContent | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [questSessionId, setQuestSessionId] = useState<string | null>(null);
  const [leaderboardCompletionToken, setLeaderboardCompletionToken] =
    useState<string | null>(null);
  const [leaderboardCompletionMetrics, setLeaderboardCompletionMetrics] =
    useState<LeaderboardCompletionMetrics | null>(null);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardMessage, setLeaderboardMessage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [leaderboardSubmitting, setLeaderboardSubmitting] = useState(false);
  const [submittedLeaderboardEntryId, setSubmittedLeaderboardEntryId] =
    useState<string | null>(null);
  const [voiceLanguage, setVoiceLanguage] = useState<QuestLanguage>(
    DEFAULT_QUEST_LANGUAGE,
  );
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const realtimeRecognitionRef = useRef<RealtimeSpeechRecognizer | null>(null);
  const recordedRecognitionRef = useRef<RecordedSpeechRecognizer | null>(null);
  const elevenLabsSttAvailableRef = useRef<boolean | null>(null);
  const previousStateRef = useRef<RoomState>("idle");
  const escapeTimerRef = useRef<number | null>(null);
  const questStateRef = useRef<QuestState>(initialQuestState);
  const questSessionIdRef = useRef<string | null>(null);
  const previousLanguageRef = useRef<QuestLanguage | null>(null);
  const voiceLanguageRef = useRef<QuestLanguage>(DEFAULT_QUEST_LANGUAGE);
  const browserFallbackLanguageRef = useRef<QuestLanguage>(DEFAULT_QUEST_LANGUAGE);
  const leaderboardCompletionOpenedRef = useRef(false);
  const turnIdRef = useRef(0);
  const wantsListeningRef = useRef(false);
  const listenAttemptRef = useRef(0);
  const pendingStopAfterStartRef = useRef(false);

  useEffect(() => {
    const browserSpeechAvailable = getSpeechRecognitionConstructor() !== undefined;

    setSpeechAvailable(browserSpeechAvailable);
    void requestRealtimeSttCapability()
      .then((capability) => {
        elevenLabsSttAvailableRef.current = capability.realtimeAvailable;
        setSpeechAvailable(browserSpeechAvailable || capability.realtimeAvailable);
      })
      .catch(() => {
        elevenLabsSttAvailableRef.current = false;
        setSpeechAvailable(browserSpeechAvailable);
      });

    return () => {
      wantsListeningRef.current = false;
      pendingStopAfterStartRef.current = false;
      listenAttemptRef.current += 1;
      recordedRecognitionRef.current?.abort();
      realtimeRecognitionRef.current?.abort();
      recognitionRef.current?.abort();

      if (escapeTimerRef.current !== null) {
        window.clearTimeout(escapeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    questStateRef.current = questState;
  }, [questState]);

  useEffect(() => {
    questSessionIdRef.current = questSessionId;
  }, [questSessionId]);

  function setRoomStateSafely(nextState: RoomState) {
    if (escapeTimerRef.current !== null) {
      window.clearTimeout(escapeTimerRef.current);
      escapeTimerRef.current = null;
    }

    setRoomState(nextState);

  }

  function setVoiceLanguageSafely(language: QuestLanguage) {
    voiceLanguageRef.current = language;
    setVoiceLanguage(language);
  }

  function getCurrentVoiceCopy() {
    return VOICE_COPY[voiceLanguageRef.current];
  }

  function scheduleEscapedState(delayMs = ESCAPE_REWARD_DELAY_MS) {
    if (escapeTimerRef.current !== null) {
      window.clearTimeout(escapeTimerRef.current);
    }

    escapeTimerRef.current = window.setTimeout(() => {
      setRoomState("escaped");
      escapeTimerRef.current = null;
    }, delayMs);
  }

  function startListening() {
    if (wantsListeningRef.current || voiceBusy) {
      return;
    }

    wantsListeningRef.current = true;
    pendingStopAfterStartRef.current = false;
    const listenAttempt = listenAttemptRef.current + 1;
    listenAttemptRef.current = listenAttempt;
    stopActiveAudio();
    window.speechSynthesis?.cancel();
    recordedRecognitionRef.current?.abort();
    realtimeRecognitionRef.current?.abort();
    recognitionRef.current?.abort();
    previousStateRef.current = roomState === "listening" ? "idle" : roomState;
    const copy = getCurrentVoiceCopy();
    setInterimTranscript("");
    setBubble({
      actor: "room",
      name: copy.microphoneName,
      text: copy.listening,
    });
    setRoomState("listening");

    if (elevenLabsSttAvailableRef.current !== false) {
      void startRecordedElevenLabsListening()
        .then((recognizer) => {
          if (listenAttempt !== listenAttemptRef.current) {
            recognizer.abort();
            return;
          }

          if (!wantsListeningRef.current || pendingStopAfterStartRef.current) {
            pendingStopAfterStartRef.current = false;
            recordedRecognitionRef.current = recognizer;
            recognizer.stop();
            recordedRecognitionRef.current = null;
            return;
          }

          recordedRecognitionRef.current = recognizer;
        })
        .catch((error: unknown) => {
          if (listenAttempt !== listenAttemptRef.current) {
            return;
          }

          if (!wantsListeningRef.current) {
            pendingStopAfterStartRef.current = false;
            setVoiceBusy(false);
            setRoomState(previousStateRef.current);
            return;
          }

          console.info("[elevenlabs-stt] Falling back to browser speech.", {
            error: error instanceof Error ? error.message : String(error),
          });
          elevenLabsSttAvailableRef.current = false;
          startBrowserSpeechRecognition();
        });
      return;
    }

    startBrowserSpeechRecognition();
  }

  async function startRecordedElevenLabsListening(): Promise<RecordedSpeechRecognizer> {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      throw new Error("Recorded microphone capture is unavailable.");
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    const chunks: Blob[] = [];
    const recordingMimeType = getSupportedRecordingMimeType();
    const recorder = new MediaRecorder(
      mediaStream,
      recordingMimeType ? { mimeType: recordingMimeType } : undefined,
    );
    let stopped = false;
    let stopResolver: (() => void) | null = null;
    const recordingStartedAt = performance.now();
    const stoppedPromise = new Promise<void>((resolve) => {
      stopResolver = resolve;
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    recorder.onstop = () => {
      stopResolver?.();
    };
    recorder.start();

    setSpeechAvailable(true);
    const copy = getCurrentVoiceCopy();
    setInterimTranscript("");
    setBubble({
      actor: "room",
      name: copy.microphoneName,
      text: copy.listening,
    });
    setRoomState("listening");

    const finish = async (shouldTranscribe: boolean) => {
      if (stopped) {
        return;
      }

      stopped = true;

      if (recorder.state !== "inactive") {
        recorder.stop();
      }

      mediaStream.getTracks().forEach((track) => track.stop());
      await stoppedPromise;

      if (!shouldTranscribe) {
        setVoiceBusy(false);
        return;
      }

      if (chunks.length === 0) {
        setVoiceBusy(false);
        setRoomState(previousStateRef.current);
        setBubble({
          actor: "room",
          name: copy.microphoneName,
          text: copy.holdLonger,
        });
        return;
      }

      const audio = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm",
      });
      const recordedDurationMs = performance.now() - recordingStartedAt;

      if (
        recordedDurationMs < MIN_RECORDED_STT_DURATION_MS ||
        audio.size < MIN_RECORDED_STT_BYTES
      ) {
        setVoiceBusy(false);
        setRoomState(previousStateRef.current);
        setBubble({
          actor: "room",
          name: copy.microphoneName,
          text: copy.holdLonger,
        });
        return;
      }

      setInterimTranscript("");
      setVoiceBusy(true);
      setBubble({
        actor: "room",
        name: copy.microphoneName,
        text: copy.thinking,
      });

      try {
        const transcription = await requestRecordedStt(audio);

        if (!transcription.text) {
          setVoiceBusy(false);
          setRoomState(previousStateRef.current);
          setBubble({
            actor: "room",
            name: copy.microphoneName,
            text: copy.notUnderstood,
          });
          return;
        }

        observePurrMarkers("elevenlabs-recorded", "committed", transcription.text);
        await applyTranscript(transcription.text, transcription.language);
      } catch (error) {
        console.info("[elevenlabs-stt] Recorded transcription failed.", {
          error: error instanceof Error ? error.message : String(error),
          bytes: audio.size,
          contentType: audio.type,
          durationMs: Math.round(recordedDurationMs),
        });
        elevenLabsSttAvailableRef.current = false;
        setVoiceBusy(false);
        setRoomState(previousStateRef.current);
        setBubble({
          actor: "room",
          name: copy.microphoneName,
          text: getSpeechRecognitionConstructor()
            ? copy.elevenLabsRetryBrowser
            : copy.elevenLabsRetryMicrophone,
        });
      }
    };

    return {
      abort() {
        void finish(false);
      },
      stop() {
        void finish(true);
      },
    };
  }

  function startBrowserSpeechRecognition() {
    const SpeechRecognition = getSpeechRecognitionConstructor();
    const copy = getCurrentVoiceCopy();

    if (!wantsListeningRef.current) {
      return;
    }

    if (!SpeechRecognition) {
      setSpeechAvailable(false);
      setRoomState("listening");
      setReadout(copy.browserUnavailableReadout);
      setBubble({
        actor: "room",
        name: copy.microphoneName,
        text: copy.browserUnavailableBubble,
      });
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = BROWSER_RECOGNITION_LANGUAGE[browserFallbackLanguageRef.current];
    recognition.continuous = false;
    recognition.interimResults = true;
    const browserLanguage = createLanguageInput({
      source: "browser-speech",
      providerLanguageCode: recognition.lang,
    });
    let submittedFinalTranscript = false;

    recognition.onstart = () => {
      if (!wantsListeningRef.current) {
        recognition.abort();
        return;
      }

      setInterimTranscript("");
      setBubble({
        actor: "room",
        name: copy.microphoneName,
        text: copy.listening,
      });
      setRoomState("listening");
    };

    recognition.onresult = (event) => {
      let interim = "";
      let finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results.item(index);
        const transcript = result.item(0).transcript.trim();

        if (result.isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim();
        } else {
          interim = `${interim} ${transcript}`.trim();
        }
      }

      setInterimTranscript(finalTranscript || interim);

      if (finalTranscript) {
        submittedFinalTranscript = true;
        observePurrMarkers("browser-speech", "committed", finalTranscript);
        void applyTranscript(finalTranscript, browserLanguage);
      }
    };

    recognition.onerror = (event) => {
      if (!wantsListeningRef.current) {
        return;
      }

      setRoomState(previousStateRef.current);
      const message =
        event.error === "not-allowed"
          ? copy.microphoneBlocked
          : copy.speechNotRecognized;

      setReadout(message);
      setBubble({
        actor: "room",
        name: copy.microphoneName,
        text: message,
      });
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setInterimTranscript("");
      if (!submittedFinalTranscript) {
        setVoiceBusy(false);
      }
      setRoomState((current) =>
        current === "listening" ? previousStateRef.current : current,
      );
    };

    recognitionRef.current = recognition;

    if (!wantsListeningRef.current) {
      recognition.abort();
      return;
    }

    recognition.start();
  }

  async function startElevenLabsRealtimeListening(): Promise<RealtimeSpeechRecognizer> {
    return startElevenLabsRealtimeRecognition({
      onStart() {
        if (!wantsListeningRef.current) {
          return;
        }

        const copy = getCurrentVoiceCopy();
        setSpeechAvailable(true);
        setInterimTranscript("");
        setBubble({
          actor: "room",
          name: copy.microphoneName,
          text: copy.listening,
        });
        setRoomState("listening");
      },
      onPartialTranscript(transcript) {
        if (!wantsListeningRef.current) {
          return;
        }

        setInterimTranscript(transcript);
        observePurrMarkers("elevenlabs", "partial", transcript);
      },
      onCommittedTranscript(transcript, language) {
        if (!wantsListeningRef.current) {
          return;
        }

        setInterimTranscript(transcript);
        observePurrMarkers("elevenlabs", "committed", transcript);
        void applyTranscript(transcript, language);
      },
      onError(error) {
        console.info("[elevenlabs-stt] Realtime session ended with an error.", {
          error,
        });
      },
      onEnd() {
        realtimeRecognitionRef.current = null;
        setInterimTranscript("");
        setRoomState((current) =>
          current === "listening" ? previousStateRef.current : current,
        );
      },
    });
  }

  function stopListening() {
    const hasActiveRecognizer =
      wantsListeningRef.current ||
      recordedRecognitionRef.current !== null ||
      realtimeRecognitionRef.current !== null ||
      recognitionRef.current !== null;

    if (!hasActiveRecognizer) {
      return;
    }

    wantsListeningRef.current = false;
    pendingStopAfterStartRef.current = recordedRecognitionRef.current === null;
    setVoiceBusy(true);
    recordedRecognitionRef.current?.stop();
    recordedRecognitionRef.current = null;
    realtimeRecognitionRef.current?.stop();
    realtimeRecognitionRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setRoomState((current) =>
      current === "listening" ? previousStateRef.current : current,
    );
  }

  function restartQuest() {
    wantsListeningRef.current = false;
    pendingStopAfterStartRef.current = false;
    listenAttemptRef.current += 1;
    recordedRecognitionRef.current?.abort();
    recordedRecognitionRef.current = null;
    realtimeRecognitionRef.current?.abort();
    realtimeRecognitionRef.current = null;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    stopActiveAudio();
    stopReplyAudioArm();
    window.speechSynthesis?.cancel();

    if (escapeTimerRef.current !== null) {
      window.clearTimeout(escapeTimerRef.current);
      escapeTimerRef.current = null;
    }

    turnIdRef.current += 1;
    questStateRef.current = initialQuestState;
    previousStateRef.current = "idle";
    setQuestState(initialQuestState);
    setRoomState("idle");
    setReadout("");
    setInterimTranscript("");
    setVoiceBusy(false);
    setBubble(null);
    setQuestSessionId(null);
    previousLanguageRef.current = null;
    browserFallbackLanguageRef.current = DEFAULT_QUEST_LANGUAGE;
    setVoiceLanguageSafely(DEFAULT_QUEST_LANGUAGE);
    leaderboardCompletionOpenedRef.current = false;
    setLeaderboardCompletionToken(null);
    setLeaderboardCompletionMetrics(null);
    setLeaderboardOpen(false);
    setLeaderboardEntries([]);
    setLeaderboardLoading(false);
    setLeaderboardMessage("");
    setDisplayName("");
    setLeaderboardSubmitting(false);
    setSubmittedLeaderboardEntryId(null);
  }

  async function applyTranscript(
    transcript: string,
    language?: QuestLanguageInput,
  ) {
    const cleanedTranscript = transcript.trim();

    if (!cleanedTranscript) {
      return;
    }

    const turnId = turnIdRef.current + 1;
    const questStateBeforeTurn = questStateRef.current;

    turnIdRef.current = turnId;
    setVoiceBusy(true);
    observePurrMarkers("voice-turn", "submitted", cleanedTranscript);
    setReadout(cleanedTranscript);
    setBubble({
      actor: "room",
      name: getCurrentVoiceCopy().playerName,
      text: cleanedTranscript,
    });

    try {
      const response = await requestVoiceTurn(
        cleanedTranscript,
        questStateBeforeTurn,
        questSessionIdRef.current,
        language,
        previousLanguageRef.current,
      );

      if (turnId !== turnIdRef.current) {
        return;
      }

      if (response.questSessionId) {
        questSessionIdRef.current = response.questSessionId;
        setQuestSessionId(response.questSessionId);
      }

      previousLanguageRef.current = response.languageDecision.language;
      setVoiceLanguageSafely(response.languageDecision.language);

      if (isReliableLanguageDecision(response.languageDecision)) {
        browserFallbackLanguageRef.current = response.languageDecision.language;
      }

      if (response.leaderboardCompletion) {
        setLeaderboardCompletionToken(response.leaderboardCompletion.token);
        setLeaderboardCompletionMetrics(response.leaderboardCompletion.metrics);
        leaderboardCompletionOpenedRef.current = true;
        setLeaderboardOpen(true);
        void loadLeaderboard();
      }

      questStateRef.current = response.nextQuestState;
      setQuestState(response.nextQuestState);
      const nextRoomState = getRoomStateForVoiceTurn(response);
      setRoomStateSafely(nextRoomState);

      const replyBubble = getBubbleForVoiceTurn(
        response.actor,
        response.reply,
        response.nextQuestState,
        response.languageDecision.language,
      );

      setReadout(response.reply);
      setBubble(replyBubble);
      const replyPlayback = playTurnReply(response);

      void replyPlayback.catch((error: unknown) => {
        console.info("[audio] Reply playback ended without audible output.", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
      await waitForReplyBusyGate(replyPlayback);

      if (turnId === turnIdRef.current && nextRoomState === "doorOpening") {
        scheduleEscapedState();
      }
    } catch {
      if (turnId !== turnIdRef.current) {
        return;
      }

      const copy = getCurrentVoiceCopy();
      const message = copy.questServerUnavailable;

      setRoomStateSafely(mapQuestStateToRoomState(questStateBeforeTurn));
      setReadout(message);
      setBubble({
        actor: "room",
        name: copy.roomName,
        text: message,
      });
      void speakWithBrowser(message, "system", voiceLanguageRef.current);
    } finally {
      if (turnId === turnIdRef.current) {
        setVoiceBusy(false);
      }
    }
  }

  const isListening = roomState === "listening";
  const questCompleted = roomState === "doorOpening" || roomState === "escaped";

  useEffect(() => {
    if (!questCompleted || leaderboardCompletionOpenedRef.current) {
      return;
    }

    leaderboardCompletionOpenedRef.current = true;
    setLeaderboardOpen(true);
    void loadLeaderboard();
  }, [questCompleted]);

  async function loadLeaderboard() {
    setLeaderboardLoading(true);
    setLeaderboardMessage("");

    try {
      const leaderboard = await requestLeaderboard();

      setLeaderboardEntries(leaderboard.entries);
      setLeaderboardMessage("");
    } catch (error) {
      setLeaderboardEntries([]);
      setLeaderboardMessage(
        getFriendlyLeaderboardError(error, voiceLanguageRef.current),
      );
    } finally {
      setLeaderboardLoading(false);
    }
  }

  async function submitLeaderboardEntry() {
    if (!leaderboardCompletionToken || leaderboardSubmitting) {
      return;
    }

    setLeaderboardSubmitting(true);
    setLeaderboardMessage("");

    try {
      const result = await requestCreateLeaderboardEntry({
        displayName,
        completionToken: leaderboardCompletionToken,
      });

      setSubmittedLeaderboardEntryId(result.entry.entryId);
      setLeaderboardEntries(result.leaderboard.entries);
      setLeaderboardMessage(getCurrentVoiceCopy().leaderboardSubmitted);
    } catch (error) {
      setLeaderboardMessage(
        getFriendlyLeaderboardError(error, voiceLanguageRef.current),
      );
    } finally {
      setLeaderboardSubmitting(false);
    }
  }

  function openLeaderboardScreen() {
    setLeaderboardOpen(true);
    void loadLeaderboard();
  }

  return (
    <main className={`quest-app quest-app--${roomState}`}>
      <RoomScene
        bubble={bubble}
        leaderboard={{
          completed: questCompleted,
          completionMetrics: leaderboardCompletionMetrics,
          displayName,
          entries: leaderboardEntries,
          isLoading: leaderboardLoading,
          isOpen: leaderboardOpen,
          isSubmitting: leaderboardSubmitting,
          message: leaderboardMessage,
          onChangeDisplayName: setDisplayName,
          onClose: () => setLeaderboardOpen(false),
          onOpen: openLeaderboardScreen,
          onSubmit: () => void submitLeaderboardEntry(),
          submittedEntryId: submittedLeaderboardEntryId,
          tokenAvailable: leaderboardCompletionToken !== null,
        }}
        questState={questState}
        roomState={roomState}
        voiceLanguage={voiceLanguage}
      />
      <AmbientHint
        questState={questState}
        roomState={roomState}
        voiceLanguage={voiceLanguage}
      />
      <SceneMic
        isListening={isListening}
        isBusy={voiceBusy}
        speechAvailable={speechAvailable}
        voiceLanguage={voiceLanguage}
        onStart={startListening}
        onStop={stopListening}
      />
      <RestartButton
        disabled={isListening || voiceBusy}
        voiceLanguage={voiceLanguage}
        onRestart={restartQuest}
      />
    </main>
  );
}

function RoomScene({
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

function FinalFireworks() {
  return (
    <div className="final-fireworks" aria-hidden="true">
      <span className="final-firework final-firework--one" />
      <span className="final-firework final-firework--two" />
      <span className="final-firework final-firework--three" />
      <span className="final-firework final-firework--four" />
      <span className="final-firework final-firework--five" />
    </div>
  );
}

function AmbientHint({
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

function Character({
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

function SceneBubble({
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

function SceneMic({
  isListening,
  isBusy,
  speechAvailable,
  voiceLanguage,
  onStart,
  onStop,
}: {
  isListening: boolean;
  isBusy: boolean;
  speechAvailable: boolean;
  voiceLanguage: QuestLanguage;
  onStart: () => void;
  onStop: () => void;
}) {
  const activePointerIdRef = useRef<number | null>(null);
  const keyboardHoldActiveRef = useRef(false);
  const copy = VOICE_COPY[voiceLanguage];
  const prompt =
    isListening
      ? copy.micSpeaking
      : isBusy
      ? copy.micBusy
      : speechAvailable
        ? copy.micReady
        : copy.micUnavailable;

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (
      (event.pointerType === "mouse" && event.button !== 0) ||
      isListening ||
      isBusy
    ) {
      return;
    }

    event.preventDefault();
    unlockReplyAudio();
    activePointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    onStart();
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    activePointerIdRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    unlockReplyAudio();
    onStop();
  }

  function handlePointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    activePointerIdRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onStop();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.repeat ||
      (event.key !== " " && event.key !== "Enter") ||
      isListening ||
      isBusy
    ) {
      return;
    }

    event.preventDefault();
    unlockReplyAudio();
    keyboardHoldActiveRef.current = true;
    onStart();
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    keyboardHoldActiveRef.current = false;

    onStop();
  }

  function handleBlur() {
    if (!keyboardHoldActiveRef.current) {
      return;
    }

    keyboardHoldActiveRef.current = false;
    onStop();
  }

  return (
    <button
      className={`scene-mic ${isListening ? "scene-mic--active" : ""}`}
      type="button"
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-label={isListening || isBusy ? copy.micWaitAria : copy.micPressAria}
      disabled={isBusy && !isListening}
    >
      <span className="scene-mic-icon" aria-hidden="true" />
      <span className="scene-mic-text">
        <span className="scene-mic-copy">{prompt}</span>
        <span className="scene-mic-hint">{copy.micAudioHint}</span>
      </span>
    </button>
  );
}

function RestartButton({
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

interface LeaderboardScreenProps {
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

function LeaderboardScreen({
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
