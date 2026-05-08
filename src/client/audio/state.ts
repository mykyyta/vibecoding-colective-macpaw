import type { ActiveReplyPlayback, ReplyAudioArm } from "../types/audio";

export const audioState: {
  activeReplyPlayback: ActiveReplyPlayback | null;
  replyAudioContext: AudioContext | null;
  replyAudioElement: HTMLAudioElement | null;
  replyAudioArm: ReplyAudioArm | null;
  replyAudioArmTimer: number | null;
  replyAudioUnlockId: number;
} = {
  activeReplyPlayback: null,
  replyAudioContext: null,
  replyAudioElement: null,
  replyAudioArm: null,
  replyAudioArmTimer: null,
  replyAudioUnlockId: 0,
};

export function getReplyAudioContext(): AudioContext | undefined {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    return undefined;
  }

  if (!audioState.replyAudioContext || audioState.replyAudioContext.state === "closed") {
    audioState.replyAudioContext = new AudioContextConstructor();
  }

  return audioState.replyAudioContext;
}

export function getReplyAudioElement(): HTMLAudioElement {
  if (!audioState.replyAudioElement) {
    audioState.replyAudioElement = new Audio();
    audioState.replyAudioElement.preload = "auto";
    audioState.replyAudioElement.setAttribute("playsinline", "true");
  }

  return audioState.replyAudioElement;
}

export function stopActiveAudio(): void {
  if (!audioState.activeReplyPlayback) {
    return;
  }

  audioState.activeReplyPlayback.stop();
  audioState.activeReplyPlayback = null;
}
