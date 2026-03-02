import type {
  ExtensionAPI,
  ExtensionContext,
} from "@mariozechner/pi-coding-agent";

type Mode = "plan" | "build" | null;

interface ModeConfig {
  name: string;
  icon: string;
  description: string;
  blockedTools: string[];
  systemPromptAddendum: string;
}

const MODES: Record<string, ModeConfig> = {
  plan: {
    name: "Plan",
    icon: "🔍",
    description: "Analysis and planning only - no file changes",
    blockedTools: ["write", "edit"],
    systemPromptAddendum:
      "You are in PLAN mode. Analyze, research, and plan only. Do not make file changes. Suggest running '/mode build' when ready to implement.",
  },
  build: {
    name: "Build",
    icon: "🔨",
    description: "Implementation mode - can make changes",
    blockedTools: [],
    systemPromptAddendum:
      "You are in BUILD mode. Implement the plan. Make necessary file changes.",
  },
};

export default function (pi: ExtensionAPI) {
  let currentMode: Mode = null;

  function updateStatus(ctx: ExtensionContext) {
    if (currentMode) {
      const config = MODES[currentMode];
      ctx.ui.setStatus("mode", `${config.icon} ${config.name} Mode`);
    } else {
      ctx.ui.setStatus("mode", "");
    }
  }

  function showModeInfo(ctx: ExtensionContext) {
    if (currentMode) {
      const config = MODES[currentMode];
      ctx.ui.notify(
        `Current mode: ${config.icon} ${config.name}\n${config.description}`,
        "info",
      );
    } else {
      ctx.ui.notify("No mode active. Available modes:", "info");
    }

    ctx.ui.notify(
      Object.entries(MODES)
        .map(([key, config]) => `  /mode ${key} - ${config.description}`)
        .join("\n") + "\n  /mode none - Clear mode",
      "info",
    );
  }

  pi.registerCommand("mode", {
    description: "Set or view mode (plan, build, none)",
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
        currentMode = arg as Mode;
        updateStatus(ctx);
        const config = MODES[currentMode];
        ctx.ui.notify(
          `Switched to ${config.icon} ${config.name} Mode\n${config.description}`,
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
          reason: `In ${config.name} mode. Run '/mode build' to make changes.`,
        };
      }
    }
  });

  pi.on("session_start", async (_event, ctx) => {
    updateStatus(ctx);
  });
}
