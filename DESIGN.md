# Design

## Theme

Light-first editorial live-demo console.

The UI is likely viewed in a bright event room and shared on laptop screens, so the default surface should stay readable, warm, and confident rather than dark and theatrical.

## Visual Tone

The interface should feel like a compact production desk for voice/audio experimentation:

- asymmetric but controlled;
- tactile but not nostalgic;
- operational but not enterprise;
- memorable without becoming decorative.

## Palette

Use perceptual color values where practical.

- Warm paper background.
- Deep ink text.
- Signal green for readiness and live state.
- Amber for demo/tunnel markers.
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
Stage panel
  -> project name, live-demo posture, tunnel marker

Readiness board
  -> mode, API port, ElevenLabs key status, MCP URL status, server pulse
```

On mobile, stack the stage panel above readiness while preserving all status information.

## Components

- Stage panel: the expressive area for the current demo concept.
- Readiness board: compact operational status.
- Demo marker: temporary visible proof that tunnel/live-demo path is active.

Avoid nested cards and repeated icon-card grids.

## Motion

Use restrained motion only when it clarifies state. Respect reduced-motion preferences. Do not use bounce or decorative animation loops.

## Accessibility

- Keep text readable on laptop screens and mobile.
- Preserve all critical status information on mobile.
- Avoid relying on color alone for readiness state.
- Use high contrast for operational labels and values.

