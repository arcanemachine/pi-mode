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

The current mode appears in the pi footer:

```
🔍 Plan Mode
```

## Custom Modes

You can define custom modes or override built-in modes by creating a `modes.json` file.

### Configuration File Locations

Pi-mode looks for configuration in these locations (first match wins):

1. `.pi/modes.json` (project-specific)
2. `~/.pi/agent/modes.json` (global)

### Example Configuration

```json
{
  "modes": {
    "review": {
      "name": "Review",
      "icon": "👁",
      "description": "Code review mode - read and analyze only",
      "blockedTools": ["write", "edit", "bash"],
      "systemPromptAddendum": "You are in REVIEW mode. Analyze code for bugs, security issues, and improvements. Do not make changes."
    },
    "safe": {
      "name": "Safe",
      "icon": "🛡",
      "description": "Safe mode - read-only tools only",
      "blockedTools": ["write", "edit", "bash"],
      "systemPromptAddendum": "You are in SAFE mode. Only use read, grep, find, and ls tools. No modifications allowed."
    }
  }
}
```

### Mode Configuration Options

| Field                  | Type     | Description                                              |
| ---------------------- | -------- | -------------------------------------------------------- |
| `name`                 | string   | Display name for the mode                                |
| `icon`                 | string   | Emoji or icon to display                                 |
| `description`          | string   | Short description shown in `/mode` list                  |
| `blockedTools`         | string[] | Array of tool names to block (e.g., `["write", "edit"]`) |
| `systemPromptAddendum` | string   | Text appended to system prompt when mode is active       |

### Overriding Built-in Modes

Custom modes with the same key as built-in modes (e.g., `"plan"`) will override the defaults.

## Development

```bash
cd /workspace/projects/pi-mode
pi -e ./src/index.ts
```

See AGENTS.md for agent-specific information.
