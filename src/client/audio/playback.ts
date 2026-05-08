import type { VoiceTurnResponse } from "../../shared/voice";
import {
  MAX_REPLY_PLAYBACK_WAIT_MS,
  REPLY_BUSY_GATE_MS,
} from "../config/timing";
import type { ActiveReplyPlayback } from "../types/audio";
import { speakWithBrowser } from "./speech-synthesis";
import {
  audioState,
  getReplyAudioContext,
  getReplyAudioElement,
  stopActiveAudio,
} from "./state";
import { stopReplyAudioArm } from "./unlock";

export async function playTurnReply(response: VoiceTurnResponse): Promise<void> {
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

export async function playBase64Audio(base64: string, contentType: string): Promise<void> {
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
  audioState.replyAudioUnlockId += 1;
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

      if (audioState.activeReplyPlayback === playback) {
        audioState.activeReplyPlayback = null;
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
    audioState.activeReplyPlayback = playback;

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

export async function playDecodedAudio(
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

      if (audioState.activeReplyPlayback === playback) {
        audioState.activeReplyPlayback = null;
      }

      source.disconnect();
      complete();
    };

    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.onended = () => {
      settle(resolve);
    };
    audioState.activeReplyPlayback = playback;

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

export async function waitForReplyBusyGate(playback: Promise<void>): Promise<void> {
  await Promise.race([
    playback,
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, REPLY_BUSY_GATE_MS);
    }),
  ]).catch(() => undefined);
}
