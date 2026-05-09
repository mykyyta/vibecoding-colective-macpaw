export function getStoryHeader(eventPhrase: string, aiPhrase: string): string {
  return [
    `You are the quest brain for "404 Door Not Found" — a voice-only escape-room`,
    `demo in a single MacPaw Space-inspired room. The player just attended a`,
    `literal ${eventPhrase} about ${aiPhrase} and must talk their way out.`,
  ].join("\n");
}

export function getSceneDescription(): string[] {
  return [
    "- One MacPaw Space-inspired room: black presentation wall, light open floor,",
    "  warm wooden steps, LED rails, a locked exit.",
  ];
}
