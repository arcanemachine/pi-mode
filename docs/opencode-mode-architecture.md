# Opencode Mode Architecture Overview

Research summary of how mode functionality (plan, build) is implemented in the opencode codebase.

## Core Concepts of Modes in Opencode

### 1. Agents as Modes

In opencode, "modes" are implemented as **agents**. The key files are:
- `/packages/opencode/src/agent/agent.ts` - Defines the agent system
- `/packages/opencode/src/session/prompt.ts` - Handles agent switching and prompt injection
- `/packages/opencode/src/tool/plan.ts` - Contains the plan_exit tool for switching

There are three agent **mode types**:
- `"primary"` - Full agents like `build` and `plan` that users can switch between
- `"subagent"` - Specialized agents like `explore`, `general` that are invoked via `@` mentions
- `"all"` - Agents that can function as either primary or subagent

### 2. Built-in Primary Agents

**Build Agent** (default):
```typescript
build: {
  name: "build",
  mode: "primary",
  permission: {
    question: "allow",
    plan_enter: "allow",  // Can suggest switching to plan mode
    // All other tools allowed by default
  }
}
```

**Plan Agent**:
```typescript
plan: {
  name: "plan",
  mode: "primary", 
  permission: {
    question: "allow",
    plan_exit: "allow",   // Can suggest switching back to build
    edit: {
      "*": "deny",        // CRITICAL: Denies ALL file edits
      ".opencode/plans/*.md": "allow"  // Except the plan file itself
    }
  }
}
```

### 3. Permission-Based Tool Filtering

The core mechanism is **permissions** (`/packages/opencode/src/permission/next.ts`):

- Each agent has a `permission` ruleset defining which tools are `allow`, `deny`, or `ask`
- The **plan agent** denies edit tools globally but allows editing only the plan file
- The **build agent** allows all editing tools

This is evaluated in `resolveTools()` in `prompt.ts` - tools are filtered based on the current agent's permissions.

### 4. Prompt Injection for Mode Context

When the agent switches, prompts are injected via `insertReminders()`:

**Plan Mode Prompt** (`/packages/opencode/src/session/prompt/plan.txt`):
```
CRITICAL: Plan mode ACTIVE - you are in READ-ONLY phase. 
STRICTLY FORBIDDEN: ANY file edits, modifications, or system changes.
```

**Build Switch Prompt** (`/packages/opencode/src/session/prompt/build-switch.txt`):
```
Your operational mode has changed from plan to build.
You are no longer in read-only mode.
You are permitted to make file changes...
```

These are injected as **synthetic text parts** in the message stream when the agent changes.

### 5. Agent Switching Mechanism

Switching happens through **special tools** or **user messages**:

**Plan Exit Tool** (`plan_exit`):
```typescript
// 1. Ask user for confirmation
const answers = await Question.ask({
  question: "Would you like to switch to the build agent?",
  // ...
})

// 2. Create new user message with different agent
const userMsg: MessageV2.User = {
  agent: "build",  // <-- Switch here
  // ...
}

// 3. The next loop iteration uses the new agent's permissions
```

The agent is stored on each **user message** (`userMsg.agent`), and the session loop reads this to determine which agent/permissions to use.

### 6. Configuration & Extensibility

Agents are configured in:
- **Code defaults** (`agent.ts` state initialization)
- **User config** (`config.ts` - `agent` field in opencode.json)
- **Custom agent files** (`.opencode/agents/*.md`)

Users can define custom agents with their own permission sets and prompts.

---

## Key Takeaways for Implementation

1. **Mode = Agent + Permissions** - A mode is essentially an agent configuration with specific tool permissions

2. **Permission System** - Use pattern-based rules (allow/deny/ask) to control tool availability per mode

3. **Prompt Injection** - Inject mode-specific system reminders when switching modes

4. **Message-Based State** - Store the current mode/agent on user messages so the history maintains context of which mode was active

5. **Explicit Transitions** - Use tools (`plan_exit`) or explicit user actions to trigger mode switches with confirmation

6. **Read-Only Enforcement** - The plan mode enforces read-only by **denying edit tools** in permissions, not by checking a flag - this is more robust

---

## Source Files Reference

| File | Purpose |
|------|---------|
| `/packages/opencode/src/agent/agent.ts` | Agent definitions and defaults |
| `/packages/opencode/src/session/prompt.ts` | Session loop, tool resolution, prompt injection |
| `/packages/opencode/src/permission/next.ts` | Permission evaluation system |
| `/packages/opencode/src/tool/plan.ts` | Plan exit tool for mode switching |
| `/packages/opencode/src/tool/registry.ts` | Tool registration and filtering |
| `/packages/opencode/src/config/config.ts` | User configuration schema |
| `/packages/opencode/src/session/prompt/plan.txt` | Plan mode system prompt |
| `/packages/opencode/src/session/prompt/build-switch.txt` | Build mode switch prompt |
