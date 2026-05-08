export interface ActiveReplyPlayback {
  stop(): void;
}

export interface ReplyAudioArm {
  stop(options?: { keepElement?: boolean }): void;
}
