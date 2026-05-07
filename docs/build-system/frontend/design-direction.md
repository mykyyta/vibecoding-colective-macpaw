---
last_updated: 2026-05-07
owner: Architect
---

# Frontend Design Direction

The frontend direction is a fullscreen voice quest product, not an event console.

## Audience

The first users are casual players, collaborators, and project reviewers. They need to understand quickly:

- that the room listens;
- who they can speak to;
- how voice changes the room state;
- what happened after they complete the quest.

## Personality

Three-word personality: **playable, tactile, mischievous**.

The UI should feel like a compact voice-driven room experience. It should be
confident and visually memorable without exposing development scaffolding in the
primary screen.

## Visual System

- **Theme:** room-first, because the product should open directly into the quest
  scene.
- **Palette:** warm paper, deep ink, signal green, amber accent, quiet clay surfaces.
- **Typography:** distinctive display face plus readable body face. Avoid default system-only typography and overused monoculture fonts.
- **Layout:** fullscreen room scene with minimal integrated microphone and
  transcript affordances.
- **Shape:** small radii, stable panels, no nested cards.
- **Motion:** restrained reveal and hover states only; respect reduced motion.

## Anti-Patterns

- Generic SaaS dashboard.
- Purple-blue AI gradients.
- Chatbot-template layout.
- Decorative terminal cosplay.
- Glassmorphism.
- Repeated icon cards.
- Marketing hero before the playable room.

## First-Screen Requirements

- Show the room immediately.
- Keep microphone and transcript feedback minimal and integrated into the scene.
- Do not show setup readiness, tunnel status, provider keys, or dev panels in
  the primary player view.
- After quest completion, allow a polished name-entry and leaderboard flow if
  that feature is active.
- A small neutral leaderboard control may live on the left presentation screen.
  It should switch that in-room screen into recent completions, and after quest
  completion it may open automatically into name entry and the leaderboard
  result. It must not use the puzzle code as a label or become a dashboard,
  progress panel, or permanent sidebar.
- Keep all text readable on mobile.
