import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type {
  QuestActor,
  QuestState,
  RealtimeSttCapabilityResponse,
  RealtimeSttSessionResponse,
  RecordedSttResponse,
  VoiceTurnResponse,
} from "../shared/voice";

type RoomState =
  | "idle"
  | "listening"
  | "guardHintGiven"
  | "catIgnored"
  | "codeRevealed"
  | "doorOpening"
  | "escaped";

type BubbleActor = "guard" | "pixel" | "room";

interface SceneBubbleContent {
  actor: BubbleActor;
  name: string;
  text: string;
}

interface BrowserSpeechRecognitionAlternative {
  transcript: string;
}

interface BrowserSpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): BrowserSpeechRecognitionAlternative;
}

interface BrowserSpeechRecognitionResultList {
  readonly length: number;
  item(index: number): BrowserSpeechRecognitionResult;
}

interface BrowserSpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: BrowserSpeechRecognitionResultList;
}

interface BrowserSpeechRecognitionErrorEvent {
  readonly error?: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onend: (() => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

interface ElevenLabsRealtimeEvent {
  message_type?: string;
  type?: string;
  text?: string;
  message?: string;
  error?: string;
}

interface RealtimeSpeechRecognizer {
  abort(): void;
  stop(): void;
}

interface RecordedSpeechRecognizer {
  abort(): void;
  stop(): void;
}

const initialQuestState: QuestState = {
  olegNameKnown: false,
  guardHintGiven: false,
  pixelAddressed: false,
  pixelRejectedOrdinaryCommand: false,
  codeRevealed: false,
  doorOpen: false,
  escaped: false,
};

let activeAudio: HTMLAudioElement | null = null;
const ELEVENLABS_STT_SAMPLE_RATE = 16_000;
const MIN_RECORDED_STT_DURATION_MS = 300;
const MIN_RECORDED_STT_BYTES = 512;
const ESCAPE_REWARD_DELAY_MS = 350;
const MAX_REPLY_PLAYBACK_WAIT_MS = 10_000;
const PURR_MARKER_PATTERN =
  /(?:^|\s)(мур+|мурк\w*|м(?:[\s-]?р)+|мр+|мяу+|мяв+|м[\s-]?я[\s-]?у+|няу+|няв+|н[\s-]?я[\s-]?у+|пур+|пурр+|пр+|purr+|pur+|mur+|meow+|mew+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+)(?=\s|$)/giu;

export function App() {
  const [roomState, setRoomState] = useState<RoomState>("idle");
  const [questState, setQuestState] = useState<QuestState>(initialQuestState);
  const [readout, setReadout] = useState("");
  const [bubble, setBubble] = useState<SceneBubbleContent | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechAvailable, setSpeechAvailable] = useState(true);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const realtimeRecognitionRef = useRef<RealtimeSpeechRecognizer | null>(null);
  const recordedRecognitionRef = useRef<RecordedSpeechRecognizer | null>(null);
  const elevenLabsSttAvailableRef = useRef<boolean | null>(null);
  const previousStateRef = useRef<RoomState>("idle");
  const escapeTimerRef = useRef<number | null>(null);
  const questStateRef = useRef<QuestState>(initialQuestState);
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

  function setRoomStateSafely(nextState: RoomState) {
    if (escapeTimerRef.current !== null) {
      window.clearTimeout(escapeTimerRef.current);
      escapeTimerRef.current = null;
    }

    setRoomState(nextState);

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
    recordedRecognitionRef.current?.abort();
    realtimeRecognitionRef.current?.abort();
    recognitionRef.current?.abort();
    previousStateRef.current = roomState === "listening" ? "idle" : roomState;
    setInterimTranscript("");
    setBubble({
      actor: "room",
      name: "Мікрофон",
      text: "Слухаю.",
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
    setInterimTranscript("");
    setBubble({
      actor: "room",
      name: "Мікрофон",
      text: "Слухаю.",
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
          name: "Мікрофон",
          text: "Потримай кнопку трохи довше і скажи фразу ще раз.",
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
          name: "Мікрофон",
          text: "Потримай кнопку трохи довше і скажи фразу ще раз.",
        });
        return;
      }

      setInterimTranscript("");
      setVoiceBusy(true);
      setBubble({
        actor: "room",
        name: "Мікрофон",
        text: "Думаю, що ти сказав.",
      });

      try {
        const transcription = await requestRecordedStt(audio);

        if (!transcription.text) {
          setVoiceBusy(false);
          setRoomState(previousStateRef.current);
          setBubble({
            actor: "room",
            name: "Мікрофон",
            text: "Не розібрав. Утримай кнопку і скажи ще раз.",
          });
          return;
        }

        observePurrMarkers("elevenlabs-recorded", "committed", transcription.text);
        await applyTranscript(transcription.text);
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
          name: "Мікрофон",
          text: getSpeechRecognitionConstructor()
            ? "ElevenLabs не розшифрував. Спробуй ще раз: наступна спроба піде через браузер."
            : "ElevenLabs не розшифрував. Перевір мікрофон і спробуй ще раз.",
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

    if (!wantsListeningRef.current) {
      return;
    }

    if (!SpeechRecognition) {
      setSpeechAvailable(false);
      setRoomState("listening");
      setReadout("Цей браузер не дав голос. Відкрий http://localhost:3000 у Chrome або Safari і дозволь мікрофон.");
      setBubble({
        actor: "room",
        name: "Мікрофон",
        text: "Цей браузер не дав голос. Відкрий демо в Chrome або Safari і дозволь мікрофон.",
      });
      return;
    }

    recognitionRef.current?.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = "uk-UA";
    recognition.continuous = false;
    recognition.interimResults = true;
    let submittedFinalTranscript = false;

    recognition.onstart = () => {
      if (!wantsListeningRef.current) {
        recognition.abort();
        return;
      }

      setInterimTranscript("");
      setBubble({
        actor: "room",
        name: "Мікрофон",
        text: "Слухаю.",
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
        void applyTranscript(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (!wantsListeningRef.current) {
        return;
      }

      setRoomState(previousStateRef.current);
      const message =
        event.error === "not-allowed"
          ? "Мікрофон заблоковано. Дозволь доступ у браузері або відкрий демо в Chrome/Safari."
          : "Голос не розпізнано.";

      setReadout(message);
      setBubble({
        actor: "room",
        name: "Мікрофон",
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

        setSpeechAvailable(true);
        setInterimTranscript("");
        setBubble({
          actor: "room",
          name: "Мікрофон",
          text: "Слухаю.",
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
      onCommittedTranscript(transcript) {
        if (!wantsListeningRef.current) {
          return;
        }

        setInterimTranscript(transcript);
        observePurrMarkers("elevenlabs", "committed", transcript);
        void applyTranscript(transcript);
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
  }

  async function applyTranscript(transcript: string) {
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
      name: "Ти",
      text: cleanedTranscript,
    });

    try {
      const response = await requestVoiceTurn(cleanedTranscript, questStateBeforeTurn);

      if (turnId !== turnIdRef.current) {
        return;
      }

      questStateRef.current = response.nextQuestState;
      setQuestState(response.nextQuestState);
      const nextRoomState = getRoomStateForVoiceTurn(response);
      setRoomStateSafely(nextRoomState);

      const replyBubble = getBubbleForVoiceTurn(
        response.actor,
        response.reply,
        response.nextQuestState,
      );

      setReadout(response.reply);
      setBubble(replyBubble);
      await playTurnReply(response);

      if (turnId === turnIdRef.current && nextRoomState === "doorOpening") {
        scheduleEscapedState();
      }
    } catch {
      if (turnId !== turnIdRef.current) {
        return;
      }

      const message =
        "Сервер квесту не відповів. Спробуй ще раз, коли локальний API піднятий.";

      setRoomStateSafely(mapQuestStateToRoomState(questStateBeforeTurn));
      setReadout(message);
      setBubble({
        actor: "room",
        name: "Кімната",
        text: message,
      });
      void speakWithBrowser(message, "system");
    } finally {
      if (turnId === turnIdRef.current) {
        setVoiceBusy(false);
      }
    }
  }

  const isListening = roomState === "listening";

  return (
    <main className={`quest-app quest-app--${roomState}`}>
      <RoomScene bubble={bubble} questState={questState} roomState={roomState} />
      <SceneMic
        isListening={isListening}
        isBusy={voiceBusy}
        speechAvailable={speechAvailable}
        onStart={startListening}
        onStop={stopListening}
      />
      <RestartButton disabled={isListening || voiceBusy} onRestart={restartQuest} />
    </main>
  );
}

function RoomScene({
  bubble,
  questState,
  roomState,
}: {
  bubble: SceneBubbleContent | null;
  questState: QuestState;
  roomState: RoomState;
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
    <section className="room-scene" aria-label="Voice-operated MacPaw Space quest room">
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

      <div className="presentation-wall">
        <div className="screen-sheen" aria-hidden="true" />
        <div className="stage-success" aria-hidden="true">
          <span>EXIT 404 RESOLVED</span>
        </div>
        <span className="stage-label">MacPaw Space</span>
      </div>
      <AmbientHint questState={questState} roomState={roomState} />

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
          aria-label="Exit keypad"
        >
          <span>{doorOpen || roomState === "codeRevealed" ? "404" : ""}</span>
        </div>
      </div>

      <Character actor="guard" roomState={roomState} />
      <Character actor="pixel" mood={pixelMood} roomState={roomState} />

      <FinalFireworks />
      <SceneBubble bubble={bubble} roomState={roomState} />
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
}: {
  questState: QuestState;
  roomState: RoomState;
}) {
  const hint = getAmbientHint(questState, roomState);

  return (
    <details className="ambient-hint" key={hint}>
      <summary className="ambient-hint__button" aria-label="Показати підказку">
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
}: {
  actor: "guard" | "pixel";
  mood?: "idle" | "ignored" | "helpful";
  roomState: RoomState;
}) {
  if (actor === "pixel") {
    return (
      <div className={`pixel pixel--${mood}`} aria-label="Pixel the cat">
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

  const isSpeaking =
    roomState === "guardHintGiven" ||
    roomState === "doorOpening" ||
    roomState === "escaped";

  return (
    <div
      className={`guard ${isSpeaking ? "guard--speaking" : ""}`}
      aria-label="Human guard"
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
}: {
  bubble: SceneBubbleContent | null;
  roomState: RoomState;
}) {
  const content = bubble ?? getListeningBubble(roomState);

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
  onStart,
  onStop,
}: {
  isListening: boolean;
  isBusy: boolean;
  speechAvailable: boolean;
  onStart: () => void;
  onStop: () => void;
}) {
  const activePointerIdRef = useRef<number | null>(null);
  const keyboardHoldActiveRef = useRef(false);
  const prompt =
    isListening
      ? "Говори"
      : isBusy
      ? "Чекай..."
      : speechAvailable
        ? "Натисни, щоб говорити"
        : "Мікрофон заблоковано";

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (
      (event.pointerType === "mouse" && event.button !== 0) ||
      isListening ||
      isBusy
    ) {
      return;
    }

    event.preventDefault();
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
      aria-label={isListening || isBusy ? "Wait" : "Press to talk"}
      disabled={isBusy && !isListening}
    >
      <span className="scene-mic-icon" aria-hidden="true" />
      <span className="scene-mic-copy">{prompt}</span>
    </button>
  );
}

function RestartButton({
  disabled,
  onRestart,
}: {
  disabled: boolean;
  onRestart: () => void;
}) {
  return (
    <button
      className="restart-quest"
      type="button"
      disabled={disabled}
      onClick={onRestart}
      aria-label="Почати з початку"
    >
      Почати з початку
    </button>
  );
}

async function requestVoiceTurn(
  transcript: string,
  questState: QuestState,
): Promise<VoiceTurnResponse> {
  const response = await fetch("/api/voice-turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transcript, questState }),
  });

  if (!response.ok) {
    throw new Error(`Voice turn failed with ${response.status}.`);
  }

  return (await response.json()) as VoiceTurnResponse;
}

async function requestRealtimeSttCapability(): Promise<RealtimeSttCapabilityResponse> {
  const response = await fetch("/api/stt/capability");

  if (!response.ok) {
    throw new Error(`Realtime STT capability failed with ${response.status}.`);
  }

  return (await response.json()) as RealtimeSttCapabilityResponse;
}

async function requestRealtimeSttSession(): Promise<RealtimeSttSessionResponse> {
  const response = await fetch("/api/stt/elevenlabs/session", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Realtime STT session failed with ${response.status}.`);
  }

  return (await response.json()) as RealtimeSttSessionResponse;
}

async function requestRecordedStt(audio: Blob): Promise<RecordedSttResponse> {
  const response = await fetch("/api/stt/elevenlabs/recorded", {
    method: "POST",
    headers: {
      "Content-Type": audio.type || "audio/webm",
    },
    body: audio,
  });

  if (!response.ok) {
    const errorText = await readResponseError(response);

    throw new Error(
      `Recorded STT failed with ${response.status}${errorText ? `: ${errorText}` : ""}.`,
    );
  }

  return (await response.json()) as RecordedSttResponse;
}

async function readResponseError(response: Response): Promise<string> {
  const body = await response.text();

  if (!body) {
    return "";
  }

  try {
    const parsed = JSON.parse(body) as { error?: unknown };

    return typeof parsed.error === "string" ? parsed.error : body;
  } catch {
    return body;
  }
}

function getSupportedRecordingMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ];

  return candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function startElevenLabsRealtimeRecognition({
  onStart,
  onPartialTranscript,
  onCommittedTranscript,
  onError,
  onEnd,
}: {
  onStart: () => void;
  onPartialTranscript: (transcript: string) => void;
  onCommittedTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}): Promise<RealtimeSpeechRecognizer> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return Promise.reject(new Error("Browser microphone capture is unavailable."));
  }

  return requestRealtimeSttSession().then(async (session) => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    const audioContext = new AudioContext();
    const socket = new WebSocket(session.websocketUrl);

    let stopped = false;
    let processor: ScriptProcessorNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let silentGain: GainNode | null = null;

    const cleanup = () => {
      stopped = true;
      processor?.disconnect();
      source?.disconnect();
      silentGain?.disconnect();
      mediaStream.getTracks().forEach((track) => track.stop());
      void audioContext.close().catch(() => undefined);

      if (
        socket.readyState === WebSocket.CONNECTING ||
        socket.readyState === WebSocket.OPEN
      ) {
        socket.close();
      }
    };

    return await new Promise<RealtimeSpeechRecognizer>((resolve, reject) => {
      let settled = false;

      const rejectBeforeOpen = (error: Error) => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        reject(error);
      };

      socket.addEventListener(
        "open",
        () => {
          if (stopped) {
            rejectBeforeOpen(new Error("Realtime STT stopped before opening."));
            return;
          }

          source = audioContext.createMediaStreamSource(mediaStream);
          processor = audioContext.createScriptProcessor(8192, 1, 1);
          silentGain = audioContext.createGain();
          silentGain.gain.value = 0;

          processor.onaudioprocess = (event) => {
            if (stopped || socket.readyState !== WebSocket.OPEN) {
              return;
            }

            const input = event.inputBuffer.getChannelData(0);
            const audioBase64 = encodePcm16Base64(
              input,
              audioContext.sampleRate,
              ELEVENLABS_STT_SAMPLE_RATE,
            );

            socket.send(
              JSON.stringify({
                message_type: "input_audio_chunk",
                audio_base_64: audioBase64,
                sample_rate: ELEVENLABS_STT_SAMPLE_RATE,
              }),
            );
          };

          source.connect(processor);
          processor.connect(silentGain);
          silentGain.connect(audioContext.destination);
          void audioContext.resume();

          settled = true;
          onStart();
          resolve({
            abort: cleanup,
            stop: cleanup,
          });
        },
        { once: true },
      );

      socket.addEventListener("message", (event) => {
        const payload = parseElevenLabsRealtimeEvent(event.data);

        if (!payload) {
          return;
        }

        const eventType = payload.message_type ?? payload.type;
        const transcript = typeof payload.text === "string" ? payload.text.trim() : "";

        if (eventType === "partial_transcript" && transcript) {
          onPartialTranscript(transcript);
          return;
        }

        if (
          (eventType === "committed_transcript" ||
            eventType === "committed_transcript_with_timestamps") &&
          transcript
        ) {
          onCommittedTranscript(transcript);
          return;
        }

        if (eventType && eventType !== "session_started") {
          const message = payload.error ?? payload.message ?? eventType;
          onError(message);
        }
      });

      socket.addEventListener("error", () => {
        const error = new Error("ElevenLabs realtime STT WebSocket failed.");

        if (!settled) {
          rejectBeforeOpen(error);
          return;
        }

        onError(error.message);
      });

      socket.addEventListener("close", () => {
        cleanup();

        if (!settled) {
          rejectBeforeOpen(new Error("ElevenLabs realtime STT WebSocket closed."));
          return;
        }

        onEnd();
      });
    });
  });
}

function getRoomStateForVoiceTurn(response: VoiceTurnResponse): RoomState {
  switch (response.event.type) {
    case "door-opened":
      return "doorOpening";
    case "code-revealed":
      return "codeRevealed";
    case "pixel-ordinary-rejected":
      return "catIgnored";
    case "guard-hint-given":
    case "oleg-name-learned":
      return "guardHintGiven";
    case "no-progress":
    case "smalltalk-replied":
      return mapQuestStateToRoomState(response.nextQuestState);
  }
}

function mapQuestStateToRoomState(questState: QuestState): RoomState {
  if (questState.escaped || questState.doorOpen) {
    return "escaped";
  }

  if (questState.codeRevealed) {
    return "codeRevealed";
  }

  if (questState.pixelRejectedOrdinaryCommand) {
    return "catIgnored";
  }

  if (questState.guardHintGiven || questState.olegNameKnown) {
    return "guardHintGiven";
  }

  return "idle";
}

function getBubbleForVoiceTurn(
  actor: QuestActor,
  reply: string,
  questState: QuestState,
): SceneBubbleContent {
  switch (actor) {
    case "guard":
      return {
        actor: "guard",
        name: questState.olegNameKnown ? "Олег" : "Охоронець",
        text: reply,
      };
    case "pixel":
      return {
        actor: "pixel",
        name: "Pixel",
        text: reply,
      };
    case "door":
      return {
        actor: "guard",
        name: "Двері",
        text: reply,
      };
    case "system":
      return {
        actor: "room",
        name: "Кімната",
        text: reply,
      };
  }
}

function getListeningBubble(state: RoomState): SceneBubbleContent | null {
  if (state === "listening") {
    return {
      actor: "room",
      name: "Мікрофон",
      text: "Слухаю.",
    };
  }

  return null;
}

function getAmbientHint(questState: QuestState, roomState: RoomState): string {
  if (roomState === "listening") {
    return "утримуй, говори, відпусти";
  }

  if (roomState === "doorOpening") {
    return "EXIT 404 RESOLVED";
  }

  if (questState.escaped || questState.doorOpen) {
    return "EXIT accepted";
  }

  if (questState.codeRevealed) {
    return "Олег чекає код";
  }

  if (questState.pixelAddressed) {
    return "Pixel любить лагідне мур-мур";
  }

  if (questState.guardHintGiven) {
    return "Pixel сидів біля keypad";
  }

  if (questState.olegNameKnown) {
    return "Олег реагує на своє ім'я";
  }

  return "спитай, як звуть охоронця";
}

async function playTurnReply(response: VoiceTurnResponse): Promise<void> {
  if (!response.audio) {
    await speakWithBrowser(response.reply, response.actor);
    return;
  }

  try {
    await playBase64Audio(response.audio.base64, response.audio.contentType);
  } catch {
    await speakWithBrowser(response.reply, response.actor);
  }
}

function playBase64Audio(base64: string, contentType: string): Promise<void> {
  const byteCharacters = window.atob(base64);
  const bytes = new Uint8Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    bytes[index] = byteCharacters.charCodeAt(index);
  }

  const audioUrl = URL.createObjectURL(new Blob([bytes], { type: contentType }));
  const audio = new Audio(audioUrl);

  stopActiveAudio();
  activeAudio = audio;

  return new Promise((resolve, reject) => {
    let settled = false;
    let playbackTimer: number | null = null;

    const settle = (complete: () => void) => {
      if (settled) {
        return;
      }

      settled = true;

      if (playbackTimer !== null) {
        window.clearTimeout(playbackTimer);
        playbackTimer = null;
      }

      if (activeAudio === audio) {
        activeAudio = null;
      }

      URL.revokeObjectURL(audioUrl);
      complete();
    };

    playbackTimer = window.setTimeout(() => {
      settle(resolve);
    }, MAX_REPLY_PLAYBACK_WAIT_MS);

    audio.addEventListener(
      "loadedmetadata",
      () => {
        if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
          return;
        }

        if (playbackTimer !== null) {
          window.clearTimeout(playbackTimer);
        }

        playbackTimer = window.setTimeout(() => {
          settle(resolve);
        }, Math.min(audio.duration * 1000 + 1_000, MAX_REPLY_PLAYBACK_WAIT_MS));
      },
      { once: true },
    );
    audio.addEventListener(
      "ended",
      () => {
        settle(resolve);
      },
      { once: true },
    );
    audio.addEventListener(
      "error",
      () => {
        settle(() => reject(new Error("Audio playback failed.")));
      },
      { once: true },
    );

    void audio.play().catch((error: unknown) => {
      settle(() =>
        reject(error instanceof Error ? error : new Error("Audio playback failed.")),
      );
    });
  });
}

function parseElevenLabsRealtimeEvent(data: unknown): ElevenLabsRealtimeEvent | null {
  if (typeof data !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(data) as unknown;

    return typeof parsed === "object" && parsed !== null
      ? (parsed as ElevenLabsRealtimeEvent)
      : null;
  } catch {
    return null;
  }
}

function encodePcm16Base64(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number,
): string {
  const sampleRateRatio = inputSampleRate / outputSampleRate;
  const outputLength = Math.max(1, Math.floor(input.length / sampleRateRatio));
  const bytes = new Uint8Array(outputLength * 2);
  const view = new DataView(bytes.buffer);

  for (let index = 0; index < outputLength; index += 1) {
    const inputIndex = Math.min(input.length - 1, Math.floor(index * sampleRateRatio));
    const sample = Math.max(-1, Math.min(1, input[inputIndex] ?? 0));
    const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7fff;

    view.setInt16(index * 2, pcm, true);
  }

  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

function observePurrMarkers(
  provider: "browser-speech" | "elevenlabs" | "elevenlabs-recorded" | "voice-turn",
  stage: "partial" | "committed" | "submitted",
  transcript: string,
): void {
  PURR_MARKER_PATTERN.lastIndex = 0;
  const markers = Array.from(transcript.matchAll(PURR_MARKER_PATTERN)).map(
    ([marker]) => marker.trim(),
  );

  if (provider === "elevenlabs" || provider === "elevenlabs-recorded") {
    console.debug(`[stt] ${provider} ${stage}`, { transcript });
  }

  if (markers.length > 0) {
    console.info("[purr-marker]", {
      provider,
      stage,
      markers,
      transcript,
    });
  }
}

function speakWithBrowser(text: string, actor: QuestActor): Promise<void> {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return Promise.resolve();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "uk-UA";
  const settings = getBrowserSpeechSettings(actor);

  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;

  stopActiveAudio();
  window.speechSynthesis.cancel();

  return new Promise((resolve) => {
    const speechTimer = window.setTimeout(resolve, MAX_REPLY_PLAYBACK_WAIT_MS);

    const settle = () => {
      window.clearTimeout(speechTimer);
      resolve();
    };

    utterance.onend = () => {
      settle();
    };
    utterance.onerror = () => {
      settle();
    };
    window.speechSynthesis.speak(utterance);
  });
}

function getBrowserSpeechSettings(actor: QuestActor): {
  rate: number;
  pitch: number;
} {
  switch (actor) {
    case "pixel":
      return { rate: 0.82, pitch: 1.08 };
    case "door":
    case "system":
      return { rate: 0.9, pitch: 0.72 };
    case "guard":
      return { rate: 0.98, pitch: 0.9 };
  }
}

function stopActiveAudio(): void {
  if (!activeAudio) {
    return;
  }

  activeAudio.pause();
  activeAudio = null;
}

function getSpeechRecognitionConstructor():
  | BrowserSpeechRecognitionConstructor
  | undefined {
  const speechWindow = window as Window & {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}
