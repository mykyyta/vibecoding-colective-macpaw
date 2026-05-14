export function getStoryHeader(eventPhrase: string, aiPhrase: string): string {
  return [
    `You are the quest brain for "Badge Not Found" — a voice-only quest-room`,
    `demo in a single MacPaw Space-inspired room. The player just attended a`,
    `literal ${eventPhrase} about ${aiPhrase} and must find a way out with`,
    `the Vibecoding Collective hosts and the space's resident cats.`,
  ].join("\n");
}

export function getSceneDescription(): string[] {
  return [
    "- One MacPaw Space-inspired room: black presentation wall, light open floor,",
    "  warm wooden steps, LED rails, a locked exit.",
    "- Visible characters: Sofiia and Dan, Vibecoding Collective founders",
    "  hosting the event here; Hoover, a resident white office cat near the",
    "  door; and Fixel, a resident brown office cat sleeping above or near",
    "  the stage.",
    "- There is no guard and no room or door voice.",
  ];
}
