export const PURR_MARKER_PATTERN =
  /(?:^|\s)(мур+|мурк\w*|м(?:[\s-]?р)+|мр+|мяу+|мяв+|м[\s-]?я[\s-]?у+|няу+|няв+|н[\s-]?я[\s-]?у+|пур+|пурр+|пр+|purr+|pur+|mur+|meow+|mew+|m(?:[\s-]?r)+|m[\s-]?e[\s-]?o[\s-]?w+|prr+)(?=\s|$)/giu;

export function observePurrMarkers(
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
