export type RoomState =
  | "idle"
  | "listening"
  | "danDoorChecked"
  | "catRejected"
  | "codeRevealed"
  | "doorOpening"
  | "escaped";

export type BubbleActor = "dan" | "hoover" | "fixel" | "room" | "sofia";

export interface SceneBubbleContent {
  actor: BubbleActor;
  name: string;
  text: string;
}
