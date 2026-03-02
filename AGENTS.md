# Agent Instructions

## Workflow

Commit when a task is completed.

## Pre-commit

```bash
npx tsc --noEmit
npx prettier --write src/index.ts package.json
```

## Commit Style

Match existing commits:
- `Add mode command with plan/build/none support`
- `Block edit/write tools in plan mode`
- `Add visual status indicator for current mode`

## Project Structure

```
pi-mode/
├── src/
│   └── index.ts          # Extension entry point
├── package.json          # Package manifest with pi config
└── AGENTS.md            # This file
```

## Implementation Notes

- Extension loads from `~/.pi/agent/extensions/` or `.pi/extensions/`
- Use `ctx.ui.setStatus()` for footer mode indicator
- Use `pi.on("tool_call", ...)` to block tools in plan mode
- Use `pi.on("before_agent_start", ...)` to inject mode-specific prompts
- Store current mode in extension state (survives within session)
