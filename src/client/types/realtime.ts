export interface ElevenLabsRealtimeEvent {
  message_type?: string;
  type?: string;
  text?: string;
  message?: string;
  error?: string;
  language_code?: string;
  language_probability?: number;
}

export interface RealtimeSpeechRecognizer {
  abort(): void;
  stop(): void;
}

export interface RecordedSpeechRecognizer {
  abort(): void;
  stop(): void;
}
