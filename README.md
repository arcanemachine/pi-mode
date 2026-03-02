# pi-mode

A pi extension that adds plan/build modes for structured development workflows.

## Features

- **Plan Mode** - Read-only analysis and planning phase
- **Build Mode** - Implementation mode with full tool access
- Visual status indicator showing current mode
- Tool blocking enforcement (can't accidentally edit in plan mode)
- Mode-specific prompt injection for better context

## Installation

### From GitHub (Recommended)

```bash
pi install git:github.com/arcanemachine/pi-mode
```

To update to the latest version:

```bash
pi update git:github.com/arcanemachine/pi-mode
```

### From Local Clone

```bash
git clone https://github.com/arcanemachine/pi-mode.git
cd pi-mode
pi install /path/to/pi-mode
```

Or use a symlink for development:

```bash
ln -s /workspace/projects/pi-mode/src ~/.pi/agent/extensions/pi-mode
```

## Usage

### Commands

- `/mode` - Show current mode and available modes
- `/mode plan` - Enter plan mode (read-only)
- `/mode build` - Enter build mode (can make changes)
- `/mode none` - Clear mode

### Modes

**Plan Mode** (`/mode plan`)

- Blocks `write` and `edit` tools
- Allows `read`, `bash`, `search` for analysis
- Injects planning-focused system prompt
- Status shows: `🔍 Plan Mode`

**Build Mode** (`/mode build`)

- All tools available
- Instructs model to implement the plan
- Status shows: `🔨 Build Mode`

### Visual Indicator

The current mode appears in the pi footer status line:

```
/workspace/projects/my-project  session-name  12k tokens  $0.004  🔍 Plan Mode
```

## Development

```
cd /workspace/projects/pi-mode
pi -e ./src/index.ts
```

See AGENTS.md for agent-specific information.
