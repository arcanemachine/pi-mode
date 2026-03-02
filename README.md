# pi-mode

A pi extension that adds configurable modes for structured development workflows.

## Features

- **Configurable modes** - Define your own modes via JSON configuration
- **Tool blocking** - Block specific tools per mode (e.g., no edits in plan mode)
- **Visual status indicator** - Shows current mode in footer
- **Mode-specific prompts** - Append instructions to system prompt per mode

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

## Configuration

Pi-mode requires configuration. Create a `modes.json` file to define your modes.

### Configuration File Locations

Pi-mode looks for configuration in these locations (first match wins):

1. `.pi/modes.json` (project-specific)
2. `~/.pi/agent/modes.json` (global)

### Example Configuration

```json
{
  "modes": {
    "plan": {
      "name": "Plan",
      "description": "Analysis and planning only - no file changes",
      "blockedTools": ["write", "edit"],
      "systemPromptAddendum": "You are in PLAN mode. Analyze, research, and plan only. Do not make file changes."
    },
    "build": {
      "name": "Build",
      "description": "Implementation mode - can make changes",
      "blockedTools": [],
      "systemPromptAddendum": "You are in BUILD mode. Implement the plan. Make necessary file changes."
    },
    "review": {
      "name": "Review",
      "description": "Code review mode - read and analyze only",
      "blockedTools": ["write", "edit", "bash"],
      "systemPromptAddendum": "You are in REVIEW mode. Analyze code for bugs, security issues, and improvements. Do not make changes."
    }
  }
}
```

### Mode Configuration Options

| Field                  | Type     | Description                                              |
| ---------------------- | -------- | -------------------------------------------------------- |
| `name`                 | string   | Display name for the mode                                |
| `description`          | string   | Short description shown in `/mode` list                  |
| `blockedTools`         | string[] | Array of tool names to block (e.g., `["write", "edit"]`) |
| `systemPromptAddendum` | string   | Text appended to system prompt when mode is active       |

## Usage

### Commands

- `/mode` - Show current mode and available modes
- `/mode <name>` - Enter specified mode
- `/mode none` - Clear mode

### Visual Indicator

The current mode appears in the pi footer:

```
Plan Mode
```

## Development

```bash
cd /workspace/projects/pi-mode
pi -e ./src/index.ts
```

See AGENTS.md for agent-specific information.
