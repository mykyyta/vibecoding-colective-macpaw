---
state: in-progress
last_updated: 2026-05-06
owner: Methodologist
---

# Documentation Standard

The documentation system is intentionally small.

## Layers

| Layer | Question | Path |
| --- | --- | --- |
| Product | What should be true for the user? | `docs/product/**` |
| Build System | What rules let us build it? | `docs/build-system/**` |
| Work | What is actively being executed? | `docs/work/**` |

## Rules

- Keep one canonical location per fact.
- Prefer editing an existing canonical doc over creating a sibling doc.
- Keep Work temporary; move durable truths into Product or Build System docs.
- Use `lower-kebab-case.md` for new documentation files.
- Add frontmatter to Work and operating-model docs when state matters.

## Frontmatter

For Initiative work docs, use:

```yaml
---
state: proposed | approved | in-progress | blocked | done
owner: Strategist | Architect | Methodologist | Planner | Orchestrator
created: YYYY-MM-DD
last_updated: YYYY-MM-DD
---
```

For operating-model and standards docs in active revision, use:

```yaml
---
state: in-progress
last_updated: YYYY-MM-DD
owner: Methodologist
---
```

## Agent Instruction Sync

When changing role semantics, skill names, paths, or operating rules, update the relevant files together:

- `AGENTS.md`
- `.agents/skills/**/SKILL.md`
- `docs/build-system/operating-model/**`

