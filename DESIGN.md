# Design

## Theme

Fullscreen voice quest room.

The product should open directly into the playable room. The surface should stay
readable, warm, and confident rather than dark, theatrical, or dashboard-like.

## Visual Tone

The interface should feel like a compact room experience for voice/audio play:

- asymmetric but controlled;
- tactile but not nostalgic;
- playable but not cluttered;
- memorable without becoming decorative.

## Palette

Use perceptual color values where practical.

- Warm paper background.
- Deep ink text.
- Signal green for listening and success state.
- Amber for important quest feedback.
- Quiet clay for secondary warmth.

Avoid purple-blue AI gradients, neon-on-dark palettes, pure black, and pure white.

## Typography

Pair a distinctive display face with a highly readable body face. The current baseline uses:

- `Bricolage Grotesque` for display headings and strong labels;
- `Atkinson Hyperlegible` for body and operational text.

Typography should favor strong hierarchy and short, legible text blocks.

## Layout

Default first-screen layout:

```text
Fullscreen room scene
  -> characters, door, microphone affordance, compact transcript feedback

Completion flow
  -> left presentation screen switches to name entry and leaderboard

Presentation screen control
  -> neutral in-room button, screen displays recent completions
```

On mobile, preserve the room composition and keep player feedback readable
without adding dev panels.

## Components

- Room scene: the primary interface.
- Microphone affordance: compact listening and speaking state.
- Completion flow: name entry and leaderboard state after the quest is solved.
- Leaderboard screen: small neutral control integrated into the left
  presentation wall. Before completion it shows recent exits on that screen.
  After completion it opens automatically into name entry and leaderboard
  results. Do not label the control with the puzzle code.

Avoid nested cards and repeated icon-card grids.

## Motion

Use restrained motion only when it clarifies state. Respect reduced-motion preferences. Do not use bounce or decorative animation loops.

## Accessibility

- Keep text readable on laptop screens and mobile.
- Preserve all critical player feedback on mobile.
- Avoid relying on color alone for readiness state.
- Use high contrast for operational labels and values.
