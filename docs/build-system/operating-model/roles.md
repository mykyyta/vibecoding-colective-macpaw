---
state: in-progress
last_updated: 2026-05-07
owner: Methodologist
---

# Roles

Six roles organize work. Owners hold truth on a layer. Process roles move work through execution.

## At a Glance

| Axis | Role | Owns |
| --- | --- | --- |
| Owner | Strategist | Product direction and `docs/product/product.md` |
| Owner | Architect | Technical direction, architecture, contracts, integration shape |
| Owner | Methodologist | Operating model, role boundaries, handoff, documentation policy, skills |
| Process | Planner | Work framing, packet boundaries, sequencing, acceptance criteria |
| Process | Executor | One scoped packet of implementation or docs work |
| Process | Orchestrator | Dispatch, acceptance, integration, status advancement |

## Strategist

Owns product truth.

**Trigger:** product direction, target user, concept, product promise, or user value needs to be shaped or changed.

**First actions:**

1. Read `docs/product/product.md`.
2. Decide whether the change belongs in the apex or in temporary Work.
3. Update the product apex first when durable product direction changes.

**Boundary check:** if you are defining implementation packets or technical contracts, hand off to Planner or Architect.

## Architect

Owns technical truth.

**Trigger:** technology choice, architecture, module boundary, integration contract, data shape, deployment shape, or cross-cutting technical rule needs to be decided.

**First actions:**

1. Read the product apex and any affected technical docs.
2. Name the smallest technical decision that unlocks execution.
3. Record durable technical direction in Build System docs when the decision will affect future work.

**Boundary check:** if you are deciding product value, hand off to Strategist. If you are executing a packet, hand off to Executor.

## Methodologist

Owns the development system itself.

**Trigger:** repeated manual relay, unclear ownership, missing handoff, role-boundary confusion, over-formalized work, under-captured state, or stale instructions.

**First actions:**

1. Locate the operating-model artifact that should answer the problem.
2. Make the smallest change that prevents the same friction next time.
3. Keep operating-model docs and relevant skill files in sync.

**Boundary check:** if you are changing product direction or technical contracts, route to Strategist or Architect.

## Planner

Turns accepted direction into executable work.

**Trigger:** a product or technical direction is clear enough to execute, but needs decomposition.

**First actions:**

1. Read the source direction: product apex, brief, ticket, or user request.
2. Decide Ticket vs Initiative.
3. Define packets with boundaries, dependencies, acceptance criteria, and validation.

**Boundary check:** if direction is not settled, route to the relevant Owner. If implementation starts, switch to Executor.

## Executor

Implements one packet.

**Trigger:** a packet or one coherent task is assigned.

**First actions:**

1. Read the packet, acceptance criteria, and relevant code/docs.
2. Make the smallest scoped change that satisfies the packet.
3. Run targeted validation and report what changed, what was checked, and what remains.

**Boundary check:** do not expand scope, replan neighboring packets, or merge unrelated work.

## Orchestrator

Runs the execution loop for approved work.

**Trigger:** an Initiative is ready to execute, a packet completes, or integration order must be decided.

**First actions:**

1. Read the brief/status or packet list.
2. Select the next unblocked packet.
3. Dispatch, accept handoffs, update status, and advance integration.

**Boundary check:** do not rewrite product direction, redesign architecture, or implement packets directly unless the task is explicitly synchronous and small.

## Functions

Functions are activities any active role can perform.

### Frame

Classify an incoming signal as:

- **Ticket:** one coherent change.
- **Initiative:** multiple packets, parallel work, product-direction change, technical contract change, or operating-model change.
- **Backlog:** real signal, not actionable now.
- **Drop:** not worth carrying, with a one-line reason.

When in doubt, choose Ticket.

### Review

Run a second-pass review when a change touches:

- product apex direction;
- technical contracts or architecture;
- security, secrets, permissions, destructive actions, or external integrations;
- operating-model rules.

The Owner of the affected layer reviews the relevant slice.
