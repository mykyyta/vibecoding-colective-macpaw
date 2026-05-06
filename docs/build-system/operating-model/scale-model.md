---
state: in-progress
last_updated: 2026-05-06
owner: Methodologist
---

# Scale Model

This project uses two work sizes: Ticket and Initiative.

## Ticket

A Ticket is one coherent change that one Executor can complete without cross-packet ordering.

Use Ticket when:

- the work has one implementation unit;
- no durable product direction changes;
- no durable technical contract changes;
- no operating-model change is required;
- no parallel workstreams are needed.

A Ticket can live in a tracked issue, a short work note, or the current conversation when the task is small enough. For event-speed work, do not create process artifacts just to feel organized.

## Initiative

An Initiative is used when the work needs durable coordination.

Use Initiative when any of these are true:

- two or more packets are needed;
- packets have dependencies or explicit integration order;
- parallel agents or workstreams are useful;
- product direction changes;
- technical contracts or architecture change;
- operating-model rules change.

Initiative artifacts live at:

```text
docs/work/initiatives/<slug>/
  brief.md
  status.md
```

## Brief Contract

An Initiative brief should include:

- Purpose
- Outcome shape
- Why this is Initiative-scale
- Scope in
- Scope out
- Acceptance criteria
- First execution unit
- Owner and mode
- Open questions

## Default

When in doubt, keep the work at Ticket scale. Promote later only when the structure demands it.

