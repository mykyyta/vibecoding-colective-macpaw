# Agent Instructions

This project is a lightweight workspace for rapid vibe-coding prototypes, especially prototypes that can use ElevenLabs voice, speech, audio, or conversational AI capabilities.

## Project Principles

- Keep the first working prototype small, demoable, and easy to change.
- Prefer a real usable slice over a broad unfinished architecture.
- Treat ElevenLabs integration as a likely core capability, but do not overfit before the event task is known.
- Record durable decisions in docs, not only in chat.
- Do not commit secrets, API keys, `.env` files, credentials, or personal data.
- Code, comments, commits, and technical docs should be in English unless a user-facing Ukrainian artifact is explicitly needed.

## Documentation System

- Product truth lives in `docs/product/product.md`.
- Operating model truth lives in `docs/build-system/operating-model/`.
- Documentation rules live in `docs/build-system/standards/documentation.md`.
- Active execution lives in `docs/work/`.
- Work docs are temporary. When an initiative finishes, durable truth moves into Product or Build System docs, and the work folder can be removed.

## Operating Model

The project uses a compact role model adapted from Pult Hardwood.

- Owners hold truth:
  - `strategist` owns product direction and the product apex.
  - `architect` owns technical direction, contracts, and architecture.
  - `methodologist` owns the development system: roles, scale, handoff, docs policy, and skills.
- Process roles move work:
  - `planner` turns accepted direction into executable packets.
  - `executor` implements one packet.
  - `orchestrator` dispatches, accepts, integrates, and advances work.

Read `docs/build-system/operating-model/readme.md` and `docs/build-system/operating-model/roles.md` before changing the operating model.

## Work Scale

- Use a **Ticket** for one coherent change that one executor can complete.
- Use an **Initiative** when the work has multiple packets, parallel work, a product-direction change, a technical contract change, or an operating-model change.
- Initiative artifacts live at `docs/work/initiatives/<slug>/{brief.md,status.md}`.
- Backlog signals live at `docs/work/backlog/<slug>.md`.

## Skill Use

A skill is a set of local instructions stored in `.agents/skills/<name>/SKILL.md`.

Available project-local role skills:

- `methodologist`: evolve the development system itself.
- `strategist`: shape and update product direction.
- `architect`: shape and update technical direction.
- `planner`: turn direction into execution packets.
- `executor`: implement one packet with scoped validation.
- `orchestrator`: dispatch, accept, integrate, and advance packets.

When a user names a role or the task clearly matches a role, read the relevant `SKILL.md` first.

## Handoff Rule

For multi-step work, handoffs should carry a pointer and a one-line summary. Put decisions, constraints, packet status, blockers, and follow-ups into `docs/work/**` instead of relying on chat history.

