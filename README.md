# pi-mode

A pi extension that adds configurable modes for structured development workflows.

## Features

- **Configurable modes** - Define your own modes via JSON configuration
- **Tool blocking** - Block specific tools or allow only specific tools per mode
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

Pi-mode requires configuration. Add a `modes` key to your pi `settings.json`.

### Configuration File Locations

Pi-mode looks for the `modes` setting in these locations (first match wins):

1. `.pi/settings.json` (project-specific)
2. `~/.pi/agent/settings.json` (global)

You can also edit settings via the `/settings` command in pi.

### Tool Control Options

Each mode must specify **either** `blockedTools` **or** `allowedTools` (mutually exclusive):

- **`blockedTools`**: Block these tools, allow everything else
  - Use for: "Allow most tools, just block a few"
  - Example: Plan mode that blocks `write` and `edit` but allows `read`, `bash`, etc.

- **`allowedTools`**: Allow only these tools, block everything else
  - Use for: "Restrict to specific tools only"
  - Example: Safe mode that only allows `read`, `grep`, `find`

### Custom Tools

Tools added by extensions are also controlled by `blockedTools` and `allowedTools`:

- With `blockedTools`: Custom tools are allowed unless explicitly listed
- With `allowedTools`: Custom tools are blocked unless explicitly listed

### Example Configuration

Add to your `.pi/settings.json` or `~/.pi/agent/settings.json`:

```json
{
  "modes": {
    "plan": {
      "description": "Analysis and planning only - no access to write/edit tools",
      "allowedTools": ["read"],
      "extraSystemPrompt": "You are in PLAN mode. You may analyze, research, and plan only. You cannot make file changes."

    },
    "safe": {
      "description": "Safe mode - no bash commands or file modifications",
      "blockedTools": ["write", "edit", "bash"],
      "extraSystemPrompt": "You are in SAFE mode. You may not write or edit files. No command execution or modifications."
    },
    "custom": {
      "name": "Custom Name",
      "description": "User-defined tools can be allowed, as well.",
      "allowedTools": ["read", "research"],
      "extraSystemPrompt": "You are in CUSTOM mode. Some default pi tools and some custom user tools are available."
    }
  }
}
```

> [!WARNING]
> If the agent has access to the `bash` tool, it can change the mode on its own!

### Mode Configuration Options

| Field                  | Type     | Required | Description                                        |
| ---------------------- | -------- | -------- | -------------------------------------------------- |
| `name`                 | string   | Yes      | Display name for the mode                          |
| `description`          | string   | Yes      | Short description shown in `/mode` list            |
| `blockedTools`         | string[] | One of   | Block these tools, allow all others                |
| `allowedTools`         | string[] | One of   | Allow only these tools, block all others           |
| `extraSystemPrompt` | string   | Yes      | Text appended to system prompt when mode is active |

**Note:** Exactly one of `blockedTools` or `allowedTools` must be provided. An error is thrown if both or neither are specified.

## Usage

### Commands

- `/mode` - Show current mode and available modes
- `/mode <name>` - Enter specified mode
- `/mode none` - Clear mode

### Visual Indicator

The current mode appears in the pi footer:

```
Mode enabled: Plan
```

## Development

```bash
cd /workspace/projects/pi-mode
pi -e ./src/index.ts
```

See AGENTS.md for agent-specific information.
