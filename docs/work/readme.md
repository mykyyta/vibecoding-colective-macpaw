# Work

`docs/work/` is the temporary control plane for active execution.

## Structure

```text
work/
  initiatives/
    <initiative-slug>/
      brief.md
      status.md
  backlog/
    <slug>.md
```

## Initiative

Use an Initiative when work needs multiple packets, parallel work, durable product direction, durable technical direction, or an operating-model update.

## Backlog

Use backlog files for real signals that are not actionable yet.

## Rule

When work is complete, move durable truth to `docs/product/**` or `docs/build-system/**`. Do not let finished Work become the long-term source of truth.

