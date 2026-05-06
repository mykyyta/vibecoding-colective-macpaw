---
last_updated: 2026-05-06
owner: Architect
---

# Frontend Design Direction

The initial frontend direction is an editorial live-demo console for an ElevenLabs-oriented event prototype.

## Audience

The first users are event participants, collaborators, mentors, and demo viewers. They need to understand quickly:

- what is running;
- whether ElevenLabs setup is ready;
- whether the local live-demo path is healthy;
- where the prototype can grow next.

## Personality

Three-word personality: **stage-ready, tactile, improvisational**.

The UI should feel like a compact production desk for a voice/audio prototype. It should be confident and visually memorable, but still practical under event pressure.

## Visual System

- **Theme:** light-first, because the UI is likely viewed in a bright event room and shared on laptop screens.
- **Palette:** warm paper, deep ink, signal green, amber accent, quiet clay surfaces.
- **Typography:** distinctive display face plus readable body face. Avoid default system-only typography and overused monoculture fonts.
- **Layout:** asymmetric first screen with a large stage panel and a compact readiness panel.
- **Shape:** small radii, stable panels, no nested cards.
- **Motion:** restrained reveal and hover states only; respect reduced motion.

## Anti-Patterns

- Generic SaaS dashboard.
- Purple-blue AI gradients.
- Chatbot-template layout.
- Decorative terminal cosplay.
- Glassmorphism.
- Repeated icon cards.
- Marketing hero without working status.

## First-Screen Requirements

- Show the project name.
- Show that this is a live demo workspace.
- Show local server readiness.
- Show ElevenLabs key and MCP URL readiness.
- Make the tunnel-test placeholder visible while the project is still being prepared.
- Keep all text readable on mobile.

