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
  blockedTools?: string[];
  allowedTools?: string[];
  extraSystemPrompt: string;
}

interface Settings {
  modes?: Record<string, ModeConfig>;
}

function loadModes(): Record<string, ModeConfig> {
  const configPaths = [
    join(process.cwd(), ".pi", "settings.json"),
    join(homedir(), ".pi", "agent", "settings.json"),
  ];

  for (const configPath of configPaths) {
    try {
      const content = readFileSync(configPath, "utf-8");
      const parsed: Settings = JSON.parse(content);
      if (parsed.modes && typeof parsed.modes === "object") {
        // Validate modes
        for (const [key, config] of Object.entries(parsed.modes)) {
          if (config.blockedTools && config.allowedTools) {
            throw new Error(
              `Mode "${key}" cannot have both blockedTools and allowedTools. Use one or the other.`,
            );
          }
          if (!config.blockedTools && !config.allowedTools) {
            throw new Error(
              `Mode "${key}" must have either blockedTools or allowedTools.`,
            );
          }
        }
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

  function getModeName(config: ModeConfig, key: string): string {
    return config.name || key.charAt(0).toUpperCase() + key.slice(1);
  }

  function updateStatus(ctx: ExtensionContext) {
    if (currentMode) {
      const config = MODES[currentMode];
      const displayName = getModeName(config, currentMode);
      ctx.ui.setStatus("mode", `Mode enabled: ${displayName}`);
    } else {
      ctx.ui.setStatus("mode", "");
    }
  }

  function showModeInfo(ctx: ExtensionContext) {
    if (currentMode) {
      const config = MODES[currentMode];
      const displayName = getModeName(config, currentMode);
      ctx.ui.notify(
        `Current mode: ${displayName}\n${config.description}`,
        "info",
      );
    } else {
      ctx.ui.notify("No mode active. Available modes:", "info");
    }

    const modeKeys = Object.keys(MODES);
    if (modeKeys.length === 0) {
      ctx.ui.notify(
        "No modes configured. Add modes to .pi/settings.json or ~/.pi/agent/settings.json",
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
        const displayName = getModeName(config, currentMode);
        ctx.ui.notify(
          `Switched to ${displayName} Mode\n${config.description}`,
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
      const displayName = getModeName(config, currentMode);

      let toolInfo = "";
      if (config.allowedTools) {
        toolInfo = `\n\nALLOWED TOOLS: ${config.allowedTools.join(", ")}`;
      } else if (config.blockedTools) {
        toolInfo = `\n\nBLOCKED TOOLS: ${config.blockedTools.join(", ")}`;
      }

      const modeSwitchInfo = `\n\nCRITICAL: You CANNOT switch modes yourself. You MUST ask the user to change the mode. Do not attempt to call any tool to change modes - it will fail.`;

      event.systemPrompt +=
        "\n\n" +
        (config.extraSystemPrompt || `You are in ${displayName} mode.`) +
        toolInfo +
        modeSwitchInfo;
    }
  });

  pi.on("tool_call", async (event, ctx) => {
    if (currentMode) {
      const config = MODES[currentMode];
      const displayName = getModeName(config, currentMode);

      // blockedTools: block these, allow everything else
      if (config.blockedTools?.includes(event.toolName)) {
        return {
          block: true,
          reason: `The ${event.toolName} tool is not allowed in ${displayName} mode.`,
        };
      }

      // allowedTools: allow these, block everything else
      if (
        config.allowedTools &&
        !config.allowedTools.includes(event.toolName)
      ) {
        return {
          block: true,
          reason: `The ${event.toolName} tool is not allowed in ${displayName} mode.`,
        };
      }
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    updateStatus(ctx);
  });
}
