# Project Standards

This project is a lightweight pet-project workspace for evolving small
AI-assisted products, especially products that can use ElevenLabs voice,
speech, audio, or Conversational AI capabilities.

This file must stay in sync with `AGENTS.md`. When one changes, update the
other in the same edit.

## Principles

- **Product first:** prefer one small, working, explainable product slice over a
  broad unfinished platform.
- **Persistent by default:** assume meaningful user-facing data should survive
  local restarts and be stored behind the server boundary when the feature needs
  durability.
- **Pet-project pace:** keep setup, architecture, and process light, but allow
  durable cloud services when they directly support the product.
- **ElevenLabs-ready:** treat voice, audio, narration, or conversational
  behavior as likely core capabilities, but do not overfit before the prompt is
  known.
- **Product clarity:** the current bottleneck is likely understanding the user,
  product promise, and next useful slice, not writing more code.
- **Minimal changes:** do not refactor surrounding code, add abstractions, or
  introduce infrastructure until the second real need appears.
- **Durable decisions:** record decisions in docs when they affect future work.
  Chat is useful for discussion, not as the only source of truth.
- **Product apex source-of-truth:** durable product direction lives in
  `docs/product/product.md`. Work plans and technical docs derive from it.

## Stack

The baseline stack is TypeScript, Vite + React, and Node.js + Express. Durable stack notes live in `docs/build-system/architecture/stack.md`.

- Prefer the smallest addition to the baseline stack that can produce a
  convincing product slice.
- Browser-first prototypes are valid if they reduce setup time.
- Server-side code is required for secrets, private API calls, webhooks, and
  any ElevenLabs operation that must not expose credentials.
- Prefer local development for iteration and cloud deployment when the product
  needs a stable public backend, persistent storage, or external callbacks.
- Do not add frameworks, databases, queues, auth, or deployment complexity until
  the prototype needs them.
- For persistent product data such as leaderboard entries, prefer a server-side
  storage boundary with a durable cloud implementation such as DynamoDB.

## ElevenLabs Integration

- MCP setup notes live in
  `docs/build-system/integrations/elevenlabs-mcp.md`.
- ElevenLabs MCP integrations require a public SSE or streamable HTTP MCP
  server URL plus an ElevenLabs API key.
- Keep `ELEVENLABS_API_KEY` and any MCP server tokens in `.env` only.
- `.env.example` documents expected variables; it must not contain real
  secrets.
- Start MCP integrations with `require_approval_all` / Always Ask. Auto-approve
  only low-risk read-only tools after reviewing what the MCP server exposes.
- Treat MCP server URLs containing secret tokens as credentials.
- Avoid sending PII or sensitive conversation data to unvetted MCP tools.

## Architecture

- Record durable technical direction under `docs/build-system/**`.
- Prefer direct integration boundaries over generic platform layers.
- Keep third-party API calls behind a server boundary when credentials are
  involved.
- Validate external input at the boundary.
- Handle errors explicitly and report actionable context.
- If a technical choice changes the product promise or user value, update Product
  first or route to Strategist.

## Code Style

- Code, comments, commits, and technical docs should be in English unless a
  user-facing Ukrainian artifact is explicitly needed.
- Do not add comments to code you did not change.
- In new code, comment only non-obvious why.
- TypeScript should avoid `any` unless there is a narrow, explained reason.
- Python function signatures should use type hints when Python is introduced.
- No emojis in code, commits, or docs.

## Workflow

- **Approval:** ask before destructive actions, high-risk external API changes,
  secret handling changes, paid resource use, force pushes, or broad new
  initiatives.
- **When stuck:** stop, explain the blocker, give 2-3 options with trade-offs,
  and recommend one.
- **Quality checks:** run the smallest meaningful validation for the change.
  Do not invent heavyweight test setup before a stack exists.
- **Frontend checks:** after adding a runnable UI, start the dev server and
  provide the local URL. Verify layout across at least desktop and mobile when
  the change is user-facing.
- **Runtime checks:** keep the app runnable locally with one command. If
  external services need access, expose the local port through ngrok or
  Cloudflare Tunnel or deploy the cloud runtime and verify the public HTTPS URL.
- **MCP checks:** when ElevenLabs credentials and an MCP URL exist, use:
  - `npm run elevenlabs:mcp:create`
  - `npm run elevenlabs:mcp:list`
  - `npm run elevenlabs:mcp:tools -- <mcp_server_id>`

## Security

- **Never commit:** secrets, API keys, tokens, `.env` files, credentials, PII,
  generated private keys, or paid-service credentials.
- **Always:** keep committed config as examples or templates.
- **If exposed:** stop, rotate the secret, remove it from history before
  pushing, and document the incident.
- Prefer HTTPS for external callbacks, MCP servers, and API endpoints.

## Git

- Default branch: `main`.
- Commit format: `<type>(<scope>): <subject>`.
- Types: `feat | fix | docs | style | refactor | test | chore | perf`.
- Subject: imperative mood, no trailing period.
- Commit coherent changes together.
- Do not push without explicit user approval.
- Do not force push unless the user explicitly requests it after risk is
  explained.
- Do not rewrite or revert user changes unless explicitly asked.

## Documentation System

- **Primary index:** `docs/readme.md`.
- **Product:** `docs/product/product.md`.
- **Operating model:** `docs/build-system/operating-model/readme.md`.
- **Roles:** `docs/build-system/operating-model/roles.md`.
- **Scale model:** `docs/build-system/operating-model/scale-model.md`.
- **Handoff:** `docs/build-system/operating-model/handoff.md`.
- **Documentation standard:** `docs/build-system/standards/documentation.md`.
- **Integrations:** `docs/build-system/integrations/`.
- **Active work:** `docs/work/initiatives/<slug>/`.
- **Backlog:** `docs/work/backlog/<slug>.md`.

### Documentation Rules

- Keep one canonical location per fact.
- Prefer updating an existing canonical doc over creating a sibling doc.
- Work docs are temporary. When work completes, move durable truth to Product or
  Build System docs.
- Use `lower-kebab-case.md` for documentation files.
- Any change that invalidates or extends facts in `docs/product/**`,
  `docs/build-system/**`, role skills, `AGENTS.md`, or `CLAUDE.md` must update
  the relevant docs in the same change.

## Operating Model

The project uses a compact role model adapted from Pult Hardwood.

- **Owners hold truth:**
  - `strategist` owns product direction and the product apex.
  - `architect` owns technical direction, contracts, and architecture.
  - `methodologist` owns the development system: roles, scale, handoff, docs
    policy, and skills.
- **Process roles move work:**
  - `planner` turns accepted direction into executable packets.
  - `executor` implements one packet.
  - `orchestrator` dispatches, accepts, integrates, and advances work.

Read `docs/build-system/operating-model/readme.md` and
`docs/build-system/operating-model/roles.md` before changing the operating
model.

## Work Scale

- Use a **Ticket** for one coherent change that one executor can complete.
- Use an **Initiative** when the work has multiple packets, parallel work, a
  product-direction change, a technical contract change, or an operating-model
  change.
- Initiative artifacts live at
  `docs/work/initiatives/<slug>/{brief.md,status.md}`.
- Backlog signals live at `docs/work/backlog/<slug>.md`.
- When in doubt, default to Ticket. Promote later only when the structure
  demands it.

## Handoff Rule

For multi-step work, handoffs should carry a pointer and a one-line summary.
Put decisions, constraints, packet status, blockers, and follow-ups into
`docs/work/**` instead of relying on chat history.

## Agent Instructions Sync

Agent instructions live in two files:

- `AGENTS.md`
- `CLAUDE.md`

Update both files in the same edit session when changing agent instructions.
They must stay semantically identical unless a tool-specific limitation forces a
small format difference.

## Skills

A skill is a set of local instructions stored in
`.agents/skills/<name>/SKILL.md`.

Canonical role taxonomy: `docs/build-system/operating-model/roles.md`.

### Available Project Skills

- `methodologist`: evolve the development system itself.
- `strategist`: shape and update product direction.
- `architect`: shape and update technical direction.
- `planner`: turn direction into execution packets.
- `executor`: implement one packet with scoped validation.
- `orchestrator`: dispatch, accept, integrate, and advance packets.

### How to Use Skills

- If the user names a role or the task clearly matches a role, read the
  relevant `SKILL.md` first.
- Use the smallest set of skills that covers the request.
- When a skill references project docs, read only the specific files needed for
  the task.
- If a skill and a doc disagree, treat it as Methodologist friction and update
  the source of truth instead of improvising silently.
