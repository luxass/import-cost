import { locateESBuild } from "env:locate";
import type { ExtensionContext } from "vscode";
import {
  ShellExecution,
  Task,
  TaskScope,
  commands,
  tasks,
  window,
  workspace
} from "vscode";

import { config } from "./configuration";
import { flush } from "./decoration";
import { cache } from "./engine/caching";
import { log } from "./logger";
import { getPackageManager } from "./pm";
import { scan } from "./scan";
import type { PackageManager } from "./types";

declare global {
  const IS_WEB: boolean;
}

export async function activate(ctx: ExtensionContext) {
  if (!IS_WEB) {
    ctx.subscriptions.push(
      commands.registerCommand("import-cost.install-esbuild", async () => {
        const pm: PackageManager = await getPackageManager();

        const args =
          pm === "yarn"
            ? ["global", "add", "esbuild"]
            : ["install", "-g", "esbuild"];

        await tasks.executeTask(
          new Task(
            {
              type: "npm"
            },
            TaskScope.Workspace,
            "Installing ESBuild",
            "npm",
            new ShellExecution(pm, args)
          )
        );
      })
    );
  }

  const esbuildPath = await locateESBuild();
  log.info("ESBuild path", esbuildPath);

  const enable = config.get("enable");
  log.info("Import Cost is turned", enable ? "on" : "off");

  ctx.subscriptions.push(
    workspace.onDidChangeTextDocument(async (event) => {
      if (!event?.document || !esbuildPath) return;
      scan(event.document, esbuildPath);
    }),
    window.onDidChangeActiveTextEditor(async (event) => {
      if (!event?.document || !esbuildPath) return;
      scan(event.document, esbuildPath);
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand("import-cost.toggle-declaration", () => {
      const enable = config.get("enable");
      config.set("enable", !enable);
      flush();
      window.showInformationMessage(`Import Cost is now turned ${enable}`);
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand("import-cost.clear-cache", () => {
      cache.clear();
      flush();
      window.showInformationMessage("Import Cost cache cleared");
    })
  );

  if (window.activeTextEditor?.document && esbuildPath) {
    scan(window.activeTextEditor.document, esbuildPath);
  }
}
