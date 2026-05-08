export type RoomState =
  | "idle"
  | "listening"
  | "guardHintGiven"
  | "catIgnored"
  | "codeRevealed"
  | "doorOpening"
  | "escaped";

export type BubbleActor = "guard" | "pixel" | "room" | "sofia";

export interface SceneBubbleContent {
  actor: BubbleActor;
  name: string;
  text: string;
}
