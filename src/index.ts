import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

type Mode = string | null;

interface ModeConfig {
  name: string;
  description: string;
  blockedTools: string[];
  systemPromptAddendum: string;
}

function loadModes(): Record<string, ModeConfig> {
  const configPaths = [
    join(process.cwd(), ".pi", "modes.json"),
    join(homedir(), ".pi", "agent", "modes.json"),
  ];

  for (const configPath of configPaths) {
    try {
      const content = readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed.modes && typeof parsed.modes === "object") {
        return parsed.modes;
      }
    } catch {
      // File doesn't exist or is invalid, continue to next path
    }
  }

  return {};
}

export default function (pi: ExtensionAPI) {
  const MODES = loadModes();

  let currentMode: Mode = null;

  function updateStatus(ctx: ExtensionContext) {
    if (currentMode) {
      const config = MODES[currentMode];
      ctx.ui.setStatus("mode", `${config.name} Mode`);
    } else {
      ctx.ui.setStatus("mode", "");
    }
  }

  function showModeInfo(ctx: ExtensionContext) {
    if (currentMode) {
      const config = MODES[currentMode];
      ctx.ui.notify(
        `Current mode: ${config.name}\n${config.description}`,
        "info",
      );
    } else {
      ctx.ui.notify("No mode active. Available modes:", "info");
    }

    const modeKeys = Object.keys(MODES);
    if (modeKeys.length === 0) {
      ctx.ui.notify(
        "No modes configured. Create .pi/modes.json to define modes.",
        "warning",
      );
      return;
    }

    const modeList = Object.entries(MODES)
      .map(([key, config]) => `  /mode ${key} - ${config.description}`)
      .join("\n");

    ctx.ui.notify(modeList + "\n  /mode none - Clear mode", "info");
  }

  pi.registerCommand("mode", {
    description: "Set or view mode",
    getArgumentCompletions: (prefix: string) => {
      const items = Object.entries(MODES).map(([key, config]) => ({
        value: key,
        label: `${key} — ${config.description}`,
      }));
      items.push({ value: "none", label: "none — Clear mode" });
      return items.filter((i) => i.value.startsWith(prefix));
    },
    handler: async (args, ctx) => {
      const arg = args?.trim().toLowerCase();

      if (!arg) {
        showModeInfo(ctx);
        return;
      }

      if (arg === "none" || arg === "clear") {
        currentMode = null;
        updateStatus(ctx);
        ctx.ui.notify("Mode cleared", "success");
        return;
      }

      if (arg in MODES) {
        currentMode = arg;
        updateStatus(ctx);
        const config = MODES[currentMode];
        ctx.ui.notify(
          `Switched to ${config.name} Mode\n${config.description}`,
          "success",
        );
        return;
      }

      ctx.ui.notify(`Unknown mode: ${arg}`, "error");
      showModeInfo(ctx);
    },
  });

  pi.on("before_agent_start", async (event, ctx) => {
    if (currentMode) {
      const config = MODES[currentMode];
      event.systemPrompt += "\n\n" + config.systemPromptAddendum;
    }
  });

  pi.on("tool_call", async (event, ctx) => {
    if (currentMode) {
      const config = MODES[currentMode];
      if (config.blockedTools.includes(event.toolName)) {
        return {
          block: true,
          reason: `In ${config.name} mode. Switch to another mode to make changes.`,
        };
      }
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    updateStatus(ctx);
  });
}
