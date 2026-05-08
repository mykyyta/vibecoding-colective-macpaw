import type { QuestLanguageInput } from "../../shared/voice";
import { requestRealtimeSttSession } from "../api/voice";
import { createLanguageInput } from "../quest/language";
import type {
  ElevenLabsRealtimeEvent,
  RealtimeSpeechRecognizer,
} from "../types/realtime";

const ELEVENLABS_STT_SAMPLE_RATE = 16_000;

export function parseElevenLabsRealtimeEvent(data: unknown): ElevenLabsRealtimeEvent | null {
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

export function createElevenLabsRealtimeLanguageInput(
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

export function encodePcm16Base64(
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

export function startElevenLabsRealtimeRecognition({
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
