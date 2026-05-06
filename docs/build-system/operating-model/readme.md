---
state: in-progress
last_updated: 2026-05-06
owner: Methodologist
---

# Operating Model

This folder defines how agents should run development work in this project.

## Founding Principles

1. **Autonomous after task formation.** Once a task has enough context, the role cycle should run without repeated manual nudges. If agents need the user to relay state between steps, the system is missing an artifact or handoff rule.
2. **Self-updating.** When the process creates friction, update the operating model instead of treating the friction as a one-off inconvenience.
3. **Product apex first.** Durable product direction belongs in `docs/product/product.md`. Work plans and technical docs derive from it.

## Roles

Six roles are split across two axes:

- **Owners:** Strategist, Architect, Methodologist.
- **Process:** Planner, Executor, Orchestrator.

The canonical role definitions live in `roles.md`.

## Work Scale

- **Ticket:** one coherent change, one executor, no work-doc artifact required.
- **Initiative:** multiple packets, parallel work, product-direction change, technical contract change, or operating-model change.

The detailed scale rules live in `scale-model.md`.

## Handoff

Multi-step work should pass through durable signals: docs, frontmatter, status entries, branches, commits, or tickets. Chat can summarize, but chat should not be the only source of state.

The detailed handoff rules live in `handoff.md`.

