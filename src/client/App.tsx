import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { mapProviderLanguageCodeToQuestLanguage } from "../shared/voice";
import type {
  CreateLeaderboardEntryResponse,
  LeaderboardCompletionMetrics,
  LeaderboardEntry,
  LeaderboardListResponse,
} from "../shared/leaderboard";
import type {
  QuestActor,
  QuestLanguage,
  QuestLanguageDecision,
  QuestLanguageInput,
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
  language_code?: string;
  language_probability?: number;
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

interface ActiveReplyPlayback {
  stop(): void;
}

interface ReplyAudioArm {
  stop(options?: { keepElement?: boolean }): void;
}

let activeReplyPlayback: ActiveReplyPlayback | null = null;
let replyAudioContext: AudioContext | null = null;
let replyAudioElement: HTMLAudioElement | null = null;
let replyAudioArm: ReplyAudioArm | null = null;
let replyAudioArmTimer: number | null = null;
let replyAudioUnlockId = 0;
const ELEVENLABS_STT_SAMPLE_RATE = 16_000;
const MIN_RECORDED_STT_DURATION_MS = 300;
const MIN_RECORDED_STT_BYTES = 512;
const ESCAPE_REWARD_DELAY_MS = 350;
const REPLY_BUSY_GATE_MS = 700;
const MAX_REPLY_PLAYBACK_WAIT_MS = 10_000;
const REPLY_AUDIO_ARM_MS = 45_000;
const SILENT_REPLY_AUDIO_DATA_URL =
  "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==";
const PURR_MARKER_PATTERN =
  /(?:^|\s)(мур+|мурк\w*|м(?:[\s-]?р)+|мр+|мяу+|мяв+|м[\s-]?я[\s-]?у+|няу+|няв+|н[\s-]?я[\s-]?у+|пур+|пурр+|пр+|purr+|pur+|mur+|meow+|mew+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+)(?=\s|$)/giu;
const DEFAULT_QUEST_LANGUAGE: QuestLanguage = "uk";
const BROWSER_RECOGNITION_LANGUAGE: Record<QuestLanguage, string> = {
  uk: "uk-UA",
  en: "en-US",
};

interface VoiceCopy {
  microphoneName: string;
  roomName: string;
  playerName: string;
  guardName: string;
  doorName: string;
  listening: string;
  holdLonger: string;
  thinking: string;
  notUnderstood: string;
  elevenLabsRetryBrowser: string;
  elevenLabsRetryMicrophone: string;
  browserUnavailableReadout: string;
  browserUnavailableBubble: string;
  microphoneBlocked: string;
  speechNotRecognized: string;
  questServerUnavailable: string;
  micSpeaking: string;
  micBusy: string;
  micReady: string;
  micUnavailable: string;
  micAudioHint: string;
  micWaitAria: string;
  micPressAria: string;
  hintAria: string;
  restart: string;
  leaderboardSubmitted: string;
  leaderboardHeading: string;
  leaderboardSceneLabel: string;
  leaderboardBoardLabel: string;
  leaderboardAria: string;
  leaderboardInvite: string;
  leaderboardNameLabel: string;
  leaderboardUnavailable: string;
  leaderboardSaving: string;
  leaderboardSave: string;
  leaderboardTries: string;
  leaderboardLoading: string;
  leaderboardEmpty: string;
  relativeJustNow: string;
  relativeMinuteAgo: (minutes: number) => string;
  relativeHourAgo: (hours: number) => string;
  ambientListening: string;
  ambientDoorOpening: string;
  ambientEscaped: string;
  ambientCodeRevealed: string;
  ambientPixelAddressed: string;
  ambientGuardHintGiven: string;
  ambientOlegKnown: string;
  ambientInitial: string;
}

const VOICE_COPY: Record<QuestLanguage, VoiceCopy> = {
  uk: {
    microphoneName: "Мікрофон",
    roomName: "Кімната",
    playerName: "Ти",
    guardName: "Охоронець",
    doorName: "Двері",
    listening: "Слухаю.",
    holdLonger: "Потримай кнопку трохи довше і скажи фразу ще раз.",
    thinking: "Думаю, що ти сказав.",
    notUnderstood: "Не розібрав. Утримай кнопку і скажи ще раз.",
    elevenLabsRetryBrowser:
      "ElevenLabs не розшифрував. Спробуй ще раз: наступна спроба піде через браузер.",
    elevenLabsRetryMicrophone:
      "ElevenLabs не розшифрував. Перевір мікрофон і спробуй ще раз.",
    browserUnavailableReadout:
      "Цей браузер не дав голос. Відкрий http://localhost:3000 у Chrome або Safari і дозволь мікрофон.",
    browserUnavailableBubble:
      "Цей браузер не дав голос. Відкрий демо в Chrome або Safari і дозволь мікрофон.",
    microphoneBlocked:
      "Мікрофон заблоковано. Дозволь доступ у браузері або відкрий демо в Chrome/Safari.",
    speechNotRecognized: "Голос не розпізнано.",
    questServerUnavailable:
      "Сервер квесту не відповів. Спробуй ще раз, коли локальний API піднятий.",
    micSpeaking: "Говори",
    micBusy: "Чекай...",
    micReady: "Натисни, щоб говорити",
    micUnavailable: "Мікрофон заблоковано",
    micAudioHint: "звук не на вібро",
    micWaitAria: "Зачекай",
    micPressAria: "Натисни, щоб говорити",
    hintAria: "Показати підказку",
    restart: "Нова спроба",
    leaderboardSubmitted: "Записано. Ти вийшов з кімнати офіційно.",
    leaderboardHeading: "Останні виходи",
    leaderboardSceneLabel: "Сцена",
    leaderboardBoardLabel: "Дошка",
    leaderboardAria: "Останні проходження",
    leaderboardInvite: "Додай ім'я, щоб потрапити в лідерборд.",
    leaderboardNameLabel: "Ім'я",
    leaderboardUnavailable: "Лідерборд ще налаштовується, запис недоступний.",
    leaderboardSaving: "Збереження",
    leaderboardSave: "Зберегти",
    leaderboardTries: "спроб",
    leaderboardLoading: "Завантаження",
    leaderboardEmpty: "Ще немає виходів",
    relativeJustNow: "щойно",
    relativeMinuteAgo: (minutes) => `${minutes} хв тому`,
    relativeHourAgo: (hours) => `${hours} год тому`,
    ambientListening: "утримуй, говори, відпусти",
    ambientDoorOpening: "EXIT resolved",
    ambientEscaped: "EXIT accepted",
    ambientCodeRevealed: "Олег чекає код",
    ambientPixelAddressed: "Pixel любить лагідне мур-мур",
    ambientGuardHintGiven: "Pixel сидів біля keypad",
    ambientOlegKnown: "Олег реагує на своє ім'я",
    ambientInitial: "спитай, як звуть охоронця",
  },
  en: {
    microphoneName: "Microphone",
    roomName: "Room",
    playerName: "You",
    guardName: "Guard",
    doorName: "Door",
    listening: "Listening.",
    holdLonger: "Hold the button a little longer and say the phrase again.",
    thinking: "Working out what you said.",
    notUnderstood: "I did not catch that. Hold the button and try again.",
    elevenLabsRetryBrowser:
      "ElevenLabs could not transcribe that. Try again: the next attempt will use browser speech.",
    elevenLabsRetryMicrophone:
      "ElevenLabs could not transcribe that. Check the microphone and try again.",
    browserUnavailableReadout:
      "This browser did not provide voice input. Open http://localhost:3000 in Chrome or Safari and allow the microphone.",
    browserUnavailableBubble:
      "This browser did not provide voice input. Open the demo in Chrome or Safari and allow the microphone.",
    microphoneBlocked:
      "Microphone blocked. Allow browser access or open the demo in Chrome/Safari.",
    speechNotRecognized: "Voice was not recognized.",
    questServerUnavailable:
      "The quest server did not answer. Try again when the local API is running.",
    micSpeaking: "Speak",
    micBusy: "Wait...",
    micReady: "Hold to speak",
    micUnavailable: "Mic blocked",
    micAudioHint: "sound on",
    micWaitAria: "Wait",
    micPressAria: "Press to talk",
    hintAria: "Show hint",
    restart: "Restart",
    leaderboardSubmitted: "Saved. You escaped the room officially.",
    leaderboardHeading: "Recent exits",
    leaderboardSceneLabel: "Scene",
    leaderboardBoardLabel: "Board",
    leaderboardAria: "Recent exits",
    leaderboardInvite: "Add your name to join the leaderboard.",
    leaderboardNameLabel: "Name",
    leaderboardUnavailable: "Leaderboard setup is still in progress, so saving is unavailable.",
    leaderboardSaving: "Saving",
    leaderboardSave: "Save",
    leaderboardTries: "tries",
    leaderboardLoading: "Loading",
    leaderboardEmpty: "No exits yet",
    relativeJustNow: "just now",
    relativeMinuteAgo: (minutes) => `${minutes} min ago`,
    relativeHourAgo: (hours) => `${hours} hr ago`,
    ambientListening: "hold, speak, release",
    ambientDoorOpening: "EXIT resolved",
    ambientEscaped: "EXIT accepted",
    ambientCodeRevealed: "Oleg is waiting for the code",
    ambientPixelAddressed: "Pixel likes a gentle purr",
    ambientGuardHintGiven: "Pixel sat near the keypad",
    ambientOlegKnown: "Oleg responds to his name",
    ambientInitial: "ask the guard for his name",
  },
};

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
      setLeaderboardMessage(getFriendlyLeaderboardError(error));
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
      setLeaderboardMessage(getFriendlyLeaderboardError(error));
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
      aria-label="Voice-operated MacPaw Space quest room"
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
        <div className="screen-sheen" aria-hidden="true" />
        <div className="stage-success" aria-hidden="true">
          <span>EXIT RESOLVED</span>
        </div>
        <span className="stage-label">MacPaw Space</span>
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
          aria-label="Exit keypad"
        >
          <span>{doorOpen || roomState === "codeRevealed" ? "404" : ""}</span>
        </div>
      </div>

      <Character actor="guard" roomState={roomState} />
      <Character actor="pixel" mood={pixelMood} roomState={roomState} />

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

async function requestVoiceTurn(
  transcript: string,
  questState: QuestState,
  questSessionId: string | null,
  language?: QuestLanguageInput,
  previousLanguage?: QuestLanguage | null,
): Promise<VoiceTurnResponse> {
  const response = await fetch("/api/voice-turn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transcript,
      questState,
      questSessionId: questSessionId ?? undefined,
      language,
      previousLanguage: previousLanguage ?? undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voice turn failed with ${response.status}.`);
  }

  return (await response.json()) as VoiceTurnResponse;
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
                  placeholder="Myk"
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

async function requestLeaderboard(): Promise<LeaderboardListResponse> {
  const response = await fetch("/api/leaderboard?limit=10");

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as LeaderboardListResponse;
}

async function requestCreateLeaderboardEntry(
  body: {
    displayName: string;
    completionToken: string;
  },
): Promise<CreateLeaderboardEntryResponse> {
  const response = await fetch("/api/leaderboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return (await response.json()) as CreateLeaderboardEntryResponse;
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

async function readApiError(response: Response): Promise<string> {
  const body = await response.text();

  if (!body) {
    return `Request failed with ${response.status}.`;
  }

  try {
    const parsed = JSON.parse(body) as {
      error?: string | { message?: unknown };
    };

    if (typeof parsed.error === "string") {
      return parsed.error;
    }

    if (typeof parsed.error?.message === "string") {
      return parsed.error.message;
    }

    return body;
  } catch {
    return body;
  }
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

function getFriendlyLeaderboardError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("disabled")) {
    return "Offline";
  }

  if (message.includes("token")) {
    return "Finish again";
  }

  if (message.includes("Display name")) {
    return "Name: 1-32 chars";
  }

  if (message.includes("configured")) {
    return "Not configured";
  }

  return "Unavailable";
}

function formatDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatRelativeTime(
  isoDate: string,
  language: QuestLanguage,
): string {
  const copy = VOICE_COPY[language];
  const elapsedSeconds = Math.max(
    0,
    Math.round((Date.now() - Date.parse(isoDate)) / 1000),
  );

  if (elapsedSeconds < 45) {
    return copy.relativeJustNow;
  }

  const elapsedMinutes = Math.round(elapsedSeconds / 60);

  if (elapsedMinutes < 60) {
    return copy.relativeMinuteAgo(elapsedMinutes);
  }

  const elapsedHours = Math.round(elapsedMinutes / 60);

  if (elapsedHours < 24) {
    return copy.relativeHourAgo(elapsedHours);
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "uk-UA", {
    day: "2-digit",
    month: "short",
  }).format(new Date(isoDate));
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
  onCommittedTranscript: (
    transcript: string,
    language?: QuestLanguageInput,
  ) => void;
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
        const language = createElevenLabsRealtimeLanguageInput(payload);

        if (eventType === "partial_transcript" && transcript) {
          onPartialTranscript(transcript);
          return;
        }

        if (
          (eventType === "committed_transcript" ||
            eventType === "committed_transcript_with_timestamps") &&
          transcript
        ) {
          onCommittedTranscript(transcript, language);
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
  language: QuestLanguage,
): SceneBubbleContent {
  const copy = VOICE_COPY[language];

  switch (actor) {
    case "guard":
      return {
        actor: "guard",
        name: questState.olegNameKnown ? "Олег" : copy.guardName,
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
        name: copy.doorName,
        text: reply,
      };
    case "system":
      return {
        actor: "room",
        name: copy.roomName,
        text: reply,
      };
  }
}

function getListeningBubble(
  state: RoomState,
  language: QuestLanguage,
): SceneBubbleContent | null {
  if (state === "listening") {
    const copy = VOICE_COPY[language];

    return {
      actor: "room",
      name: copy.microphoneName,
      text: copy.listening,
    };
  }

  return null;
}

function getAmbientHint(
  questState: QuestState,
  roomState: RoomState,
  language: QuestLanguage,
): string {
  const copy = VOICE_COPY[language];

  if (roomState === "listening") {
    return copy.ambientListening;
  }

  if (roomState === "doorOpening") {
    return copy.ambientDoorOpening;
  }

  if (questState.escaped || questState.doorOpen) {
    return copy.ambientEscaped;
  }

  if (questState.codeRevealed) {
    return copy.ambientCodeRevealed;
  }

  if (questState.pixelAddressed) {
    return copy.ambientPixelAddressed;
  }

  if (questState.guardHintGiven) {
    return copy.ambientGuardHintGiven;
  }

  if (questState.olegNameKnown) {
    return copy.ambientOlegKnown;
  }

  return copy.ambientInitial;
}

async function playTurnReply(response: VoiceTurnResponse): Promise<void> {
  if (!response.audio) {
    await speakWithBrowser(
      response.reply,
      response.actor,
      response.languageDecision.language,
    );
    return;
  }

  try {
    await playBase64Audio(response.audio.base64, response.audio.contentType);
  } catch {
    await speakWithBrowser(
      response.reply,
      response.actor,
      response.languageDecision.language,
    );
  }
}

async function playBase64Audio(base64: string, contentType: string): Promise<void> {
  const byteCharacters = window.atob(base64);
  const bytes = new Uint8Array(byteCharacters.length);

  for (let index = 0; index < byteCharacters.length; index += 1) {
    bytes[index] = byteCharacters.charCodeAt(index);
  }

  const audioContext = getReplyAudioContext();

  if (audioContext) {
    try {
      await playDecodedAudio(bytes, audioContext);
      return;
    } catch (error) {
      console.info("[audio] Web Audio reply playback failed; falling back.", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  stopActiveAudio();
  replyAudioUnlockId += 1;
  const audioUrl = URL.createObjectURL(new Blob([bytes], { type: contentType }));
  const audio = getReplyAudioElement();

  return new Promise((resolve, reject) => {
    let settled = false;
    let playbackTimer: number | null = null;
    let playback: ActiveReplyPlayback | null = null;

    const settle = (complete: () => void) => {
      if (settled) {
        return;
      }

      settled = true;

      if (playbackTimer !== null) {
        window.clearTimeout(playbackTimer);
        playbackTimer = null;
      }

      if (activeReplyPlayback === playback) {
        activeReplyPlayback = null;
      }

      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.loop = false;
      audio.removeAttribute("src");
      audio.load();
      URL.revokeObjectURL(audioUrl);
      complete();
    };

    const handleLoadedMetadata = () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
        return;
      }

      if (playbackTimer !== null) {
        window.clearTimeout(playbackTimer);
      }

      playbackTimer = window.setTimeout(() => {
        settle(resolve);
      }, Math.min(audio.duration * 1000 + 1_000, MAX_REPLY_PLAYBACK_WAIT_MS));
    };

    const handleEnded = () => {
      settle(resolve);
    };

    const handleError = () => {
      settle(() => reject(new Error("Audio playback failed.")));
    };

    playback = {
      stop() {
        settle(resolve);
      },
    };
    activeReplyPlayback = playback;

    stopReplyAudioArm({ keepElement: true });
    playbackTimer = window.setTimeout(() => {
      settle(resolve);
    }, MAX_REPLY_PLAYBACK_WAIT_MS);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    audio.muted = false;
    audio.loop = false;
    audio.src = audioUrl;
    audio.load();
    void audio.play().catch((error: unknown) => {
      console.info("[audio] HTMLAudio reply playback failed.", {
        error: error instanceof Error ? error.message : String(error),
        contentType,
      });
      settle(() =>
        reject(error instanceof Error ? error : new Error("Audio playback failed.")),
      );
    });
  });
}

async function playDecodedAudio(
  bytes: Uint8Array,
  audioContext: AudioContext,
): Promise<void> {
  if (audioContext.state === "suspended") {
    await audioContext.resume();
  }

  const audioData = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(audioData).set(bytes);

  const audioBuffer = await audioContext.decodeAudioData(audioData);

  stopActiveAudio();
  stopReplyAudioArm();

  return new Promise((resolve, reject) => {
    const source = audioContext.createBufferSource();
    let settled = false;
    let playbackTimer: number | null = null;

    const playback: ActiveReplyPlayback = {
      stop() {
        try {
          source.stop();
        } catch {
          // The source may already have ended or may not have started yet.
        }
      },
    };

    const settle = (complete: () => void) => {
      if (settled) {
        return;
      }

      settled = true;

      if (playbackTimer !== null) {
        window.clearTimeout(playbackTimer);
        playbackTimer = null;
      }

      if (activeReplyPlayback === playback) {
        activeReplyPlayback = null;
      }

      source.disconnect();
      complete();
    };

    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      settle(resolve);
    };
    activeReplyPlayback = playback;

    playbackTimer = window.setTimeout(() => {
      settle(resolve);
    }, Math.min(audioBuffer.duration * 1000 + 1_000, MAX_REPLY_PLAYBACK_WAIT_MS));

    try {
      source.start();
    } catch (error) {
      settle(() =>
        reject(error instanceof Error ? error : new Error("Audio playback failed.")),
      );
    }
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

function createElevenLabsRealtimeLanguageInput(
  event: ElevenLabsRealtimeEvent,
): QuestLanguageInput | undefined {
  return createLanguageInput({
    source: "elevenlabs",
    providerLanguageCode:
      typeof event.language_code === "string" ? event.language_code : undefined,
    confidence:
      typeof event.language_probability === "number"
        ? event.language_probability
        : undefined,
  });
}

function isReliableLanguageDecision(decision: QuestLanguageDecision): boolean {
  return !decision.ambiguous && decision.source !== "default";
}

function createLanguageInput({
  source,
  providerLanguageCode,
  confidence,
}: {
  source: QuestLanguageInput["source"];
  providerLanguageCode?: string;
  confidence?: number;
}): QuestLanguageInput | undefined {
  const cleanProviderLanguageCode = providerLanguageCode?.trim();
  const cleanConfidence =
    typeof confidence === "number" && Number.isFinite(confidence)
      ? Math.max(0, Math.min(1, confidence))
      : undefined;

  if (!source && !cleanProviderLanguageCode && cleanConfidence === undefined) {
    return undefined;
  }

  return {
    language: cleanProviderLanguageCode
      ? mapProviderLanguageCodeToQuestLanguage(cleanProviderLanguageCode)
      : undefined,
    confidence: cleanConfidence,
    providerLanguageCode: cleanProviderLanguageCode || undefined,
    source,
  };
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

function speakWithBrowser(
  text: string,
  actor: QuestActor,
  language: QuestLanguage,
): Promise<void> {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return Promise.resolve();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = BROWSER_RECOGNITION_LANGUAGE[language];
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

async function waitForReplyBusyGate(playback: Promise<void>): Promise<void> {
  await Promise.race([
    playback,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, REPLY_BUSY_GATE_MS);
    }),
  ]).catch(() => undefined);
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

function unlockReplyAudio(): void {
  stopReplyAudioArm();
  const audioContext = getReplyAudioContext();
  const cleanupTasks: Array<(options?: { keepElement?: boolean }) => void> = [];

  if (audioContext) {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();

    source.buffer = audioContext.createBuffer(1, audioContext.sampleRate, audioContext.sampleRate);
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(audioContext.destination);
    cleanupTasks.push(() => {
      try {
        source.stop();
      } catch {
        // The arming source may already have stopped.
      }

      source.disconnect();
      gain.disconnect();
    });

    try {
      source.start();
    } catch {
      source.disconnect();
      gain.disconnect();
    }

    void audioContext.resume().catch((error: unknown) => {
      console.info("[audio] Could not unlock reply audio context.", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  const audio = getReplyAudioElement();
  const unlockId = replyAudioUnlockId + 1;

  replyAudioUnlockId = unlockId;

  audio.muted = true;
  audio.loop = true;
  audio.src = SILENT_REPLY_AUDIO_DATA_URL;
  audio.load();
  cleanupTasks.push((options) => {
    if (options?.keepElement) {
      return;
    }

    audio.pause();
    audio.loop = false;
    audio.currentTime = 0;
    audio.removeAttribute("src");
    audio.load();
    audio.muted = false;
  });
  replyAudioArm = {
    stop(options) {
      for (const cleanup of cleanupTasks) {
        cleanup(options);
      }
    },
  };
  scheduleReplyAudioArmExpiry(unlockId);

  void audio
    .play()
    .then(() => {
      if (unlockId !== replyAudioUnlockId || activeReplyPlayback) {
        return;
      }
    })
    .catch((error: unknown) => {
      console.info("[audio] Could not unlock reply audio element.", {
        error: error instanceof Error ? error.message : String(error),
      });
    })
    .finally(() => {
      if (unlockId === replyAudioUnlockId && !activeReplyPlayback) {
        audio.muted = true;
      }
    });
}

function scheduleReplyAudioArmExpiry(unlockId: number): void {
  if (replyAudioArmTimer !== null) {
    window.clearTimeout(replyAudioArmTimer);
  }

  replyAudioArmTimer = window.setTimeout(() => {
    if (unlockId === replyAudioUnlockId && !activeReplyPlayback) {
      stopReplyAudioArm();
    }
  }, REPLY_AUDIO_ARM_MS);
}

function stopReplyAudioArm(options?: { keepElement?: boolean }): void {
  if (replyAudioArmTimer !== null) {
    window.clearTimeout(replyAudioArmTimer);
    replyAudioArmTimer = null;
  }

  if (!replyAudioArm) {
    return;
  }

  replyAudioArm.stop(options);
  replyAudioArm = null;
}

function getReplyAudioContext(): AudioContext | undefined {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    return undefined;
  }

  if (!replyAudioContext || replyAudioContext.state === "closed") {
    replyAudioContext = new AudioContextConstructor();
  }

  return replyAudioContext;
}

function getReplyAudioElement(): HTMLAudioElement {
  if (!replyAudioElement) {
    replyAudioElement = new Audio();
    replyAudioElement.preload = "auto";
    replyAudioElement.setAttribute("playsinline", "true");
  }

  return replyAudioElement;
}

function stopActiveAudio(): void {
  if (!activeReplyPlayback) {
    return;
  }

  activeReplyPlayback.stop();
  activeReplyPlayback = null;
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
