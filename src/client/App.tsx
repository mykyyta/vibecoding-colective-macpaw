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
const PURR_MARKER_PATTERN =
  /(?:^|\s)(мур+|м(?:-?р)+|purr+|pur+|mur+|m(?:-?r)+|prr+)(?=\s|$)/giu;

export function App() {
  const [roomState, setRoomState] = useState<RoomState>("idle");
  const [questState, setQuestState] = useState<QuestState>(initialQuestState);
  const [readout, setReadout] = useState("");
  const [bubble, setBubble] = useState<SceneBubbleContent | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechAvailable, setSpeechAvailable] = useState(true);
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

    if (nextState === "doorOpening") {
      escapeTimerRef.current = window.setTimeout(() => {
        setRoomState("escaped");
      }, 1350);
    }
  }

  function startListening() {
    if (wantsListeningRef.current) {
      return;
    }

    wantsListeningRef.current = true;
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
          if (!wantsListeningRef.current || listenAttempt !== listenAttemptRef.current) {
            recognizer.abort();
            return;
          }

          recordedRecognitionRef.current = recognizer;
        })
        .catch((error: unknown) => {
          if (!wantsListeningRef.current || listenAttempt !== listenAttemptRef.current) {
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

      if (!shouldTranscribe || chunks.length === 0) {
        return;
      }

      const audio = new Blob(chunks, {
        type: recorder.mimeType || "audio/webm",
      });

      setInterimTranscript("");
      setBubble({
        actor: "room",
        name: "Мікрофон",
        text: "Думаю, що ти сказав.",
      });

      try {
        const transcription = await requestRecordedStt(audio);

        if (!transcription.text) {
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
      } catch {
        elevenLabsSttAvailableRef.current = false;
        setRoomState(previousStateRef.current);
        setBubble({
          actor: "room",
          name: "Мікрофон",
          text: "ElevenLabs STT не відповів. Спробуй ще раз або онови сторінку.",
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
      if (!wantsListeningRef.current) {
        return;
      }

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
    wantsListeningRef.current = false;
    listenAttemptRef.current += 1;
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

  async function applyTranscript(transcript: string) {
    const cleanedTranscript = transcript.trim();

    if (!cleanedTranscript) {
      return;
    }

    const turnId = turnIdRef.current + 1;
    const questStateBeforeTurn = questStateRef.current;

    turnIdRef.current = turnId;
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
      setRoomStateSafely(getRoomStateForVoiceTurn(response));

      const replyBubble = getBubbleForVoiceTurn(
        response.actor,
        response.reply,
        response.nextQuestState,
      );

      setReadout(response.reply);
      setBubble(replyBubble);
      await playTurnReply(response);
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
      speakWithBrowser(message, "system");
    }
  }

  const isListening = roomState === "listening";

  return (
    <main className={`quest-app quest-app--${roomState}`}>
      <RoomScene bubble={bubble} roomState={roomState} />
      <SceneMic
        isListening={isListening}
        speechAvailable={speechAvailable}
        transcript={interimTranscript || readout}
        onStart={startListening}
        onStop={stopListening}
      />
    </main>
  );
}

function RoomScene({
  bubble,
  roomState,
}: {
  bubble: SceneBubbleContent | null;
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
        <span className="stage-label">MacPaw Space</span>
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

      <SceneBubble bubble={bubble} roomState={roomState} />
    </section>
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
  speechAvailable,
  transcript,
  onStart,
  onStop,
}: {
  isListening: boolean;
  speechAvailable: boolean;
  transcript: string;
  onStart: () => void;
  onStop: () => void;
}) {
  const prompt = isListening
    ? transcript || "Говори. Відпусти кнопку, коли закінчиш."
    : transcript || (speechAvailable ? "Утримуй і скажи: як тебе звати?" : "Мікрофон заблоковано");

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.button !== 0 || isListening) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    onStart();
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onStop();
  }

  function handlePointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    onStop();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.repeat || (event.key !== " " && event.key !== "Enter") || isListening) {
      return;
    }

    event.preventDefault();
    onStart();
  }

  function handleKeyUp(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    onStop();
  }

  return (
    <button
      className={`scene-mic ${isListening ? "scene-mic--active" : ""}`}
      type="button"
      onBlur={onStop}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      aria-label={isListening ? "Release to stop listening" : "Hold to talk"}
    >
      <span className="scene-mic-icon" aria-hidden="true" />
      <span className="scene-mic-copy">{prompt}</span>
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
    throw new Error(`Recorded STT failed with ${response.status}.`);
  }

  return (await response.json()) as RecordedSttResponse;
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
  if (state === "idle") {
    return {
      actor: "room",
      name: "Кімната",
      text: "Натисни мікрофон і спитай: як тебе звати?",
    };
  }

  if (state === "listening") {
    return {
      actor: "room",
      name: "Мікрофон",
      text: "Слухаю.",
    };
  }

  return null;
}

async function playTurnReply(response: VoiceTurnResponse): Promise<void> {
  if (!response.audio) {
    speakWithBrowser(response.reply, response.actor);
    return;
  }

  try {
    await playBase64Audio(response.audio.base64, response.audio.contentType);
  } catch {
    speakWithBrowser(response.reply, response.actor);
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
    audio.addEventListener(
      "ended",
      () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        URL.revokeObjectURL(audioUrl);
        resolve();
      },
      { once: true },
    );
    audio.addEventListener(
      "error",
      () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }

        URL.revokeObjectURL(audioUrl);
        reject(new Error("Audio playback failed."));
      },
      { once: true },
    );

    void audio.play().catch((error: unknown) => {
      if (activeAudio === audio) {
        activeAudio = null;
      }

      URL.revokeObjectURL(audioUrl);
      reject(error instanceof Error ? error : new Error("Audio playback failed."));
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

function speakWithBrowser(text: string, actor: QuestActor): void {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "uk-UA";
  utterance.rate = actor === "pixel" ? 0.95 : 1;
  utterance.pitch = actor === "pixel" ? 1.35 : 1;

  stopActiveAudio();
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
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
