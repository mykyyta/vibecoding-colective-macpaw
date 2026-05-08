import { SILENT_REPLY_AUDIO_DATA_URL } from "../config/assets";
import { REPLY_AUDIO_ARM_MS } from "../config/timing";
import {
  audioState,
  getReplyAudioContext,
  getReplyAudioElement,
} from "./state";

export function unlockReplyAudio(): void {
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
  const unlockId = audioState.replyAudioUnlockId + 1;

  audioState.replyAudioUnlockId = unlockId;

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
  audioState.replyAudioArm = {
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
      if (unlockId !== audioState.replyAudioUnlockId || audioState.activeReplyPlayback) {
        return;
      }
    })
    .catch((error: unknown) => {
      console.info("[audio] Could not unlock reply audio element.", {
        error: error instanceof Error ? error.message : String(error),
      });
    })
    .finally(() => {
      if (unlockId === audioState.replyAudioUnlockId && !audioState.activeReplyPlayback) {
        audio.muted = true;
      }
    });
}

export function scheduleReplyAudioArmExpiry(unlockId: number): void {
  if (audioState.replyAudioArmTimer !== null) {
    window.clearTimeout(audioState.replyAudioArmTimer);
  }

  audioState.replyAudioArmTimer = window.setTimeout(() => {
    if (unlockId === audioState.replyAudioUnlockId && !audioState.activeReplyPlayback) {
      stopReplyAudioArm();
    }
  }, REPLY_AUDIO_ARM_MS);
}

export function stopReplyAudioArm(options?: { keepElement?: boolean }): void {
  if (audioState.replyAudioArmTimer !== null) {
    window.clearTimeout(audioState.replyAudioArmTimer);
    audioState.replyAudioArmTimer = null;
  }

  if (!audioState.replyAudioArm) {
    return;
  }

  audioState.replyAudioArm.stop(options);
  audioState.replyAudioArm = null;
}
