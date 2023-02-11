import { locateESBuild } from "env:locate";
import type { ExtensionContext } from "vscode";
import {
  ShellExecution,
  Task,
  TaskScope,
  commands,
  extensions,
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
  const wixImportCost = extensions.getExtension("wix.vscode-import-cost");
  if (wixImportCost) {
    window.showWarningMessage("You have both Wix Import Cost and Import Cost installed. Please uninstall Wix Import Cost to avoid conflicts.");
    return;
  }

  if (!IS_WEB) {
    ctx.subscriptions.push(
      commands.registerCommand("import-cost.install-esbuild", async () => {
        const pm: PackageManager = await getPackageManager();

        const args =
          pm === "yarn" ?
              ["global", "add", "esbuild"] :
              ["install", "-g", "esbuild"];

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
    workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("import-cost")) return;

      log.info("Configuration changed", JSON.stringify(event, null, 2));
    })
  );
  ctx.subscriptions.push(
    commands.registerCommand("import-cost.toggle-import-cost", () => {
      window.showInformationMessage("Import Cost: toggle-declaration");
      const enable = !config.get("enable");
      if (enable) {
        console.log(window.activeTextEditor, esbuildPath);
        if (window.activeTextEditor?.document && esbuildPath) {
          scan(window.activeTextEditor.document, esbuildPath);
          console.log("scan");
        }
      } else {
        flush(window.activeTextEditor);
      }

      config.set("enable", enable);
      window.showInformationMessage(
        `Import Cost is now turned ${enable ? "on" : "off"}`
      );
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand("import-cost.clear-import-cache", (event) => {
      log.info("Clearing cache", event);
      cache.clear();
      flush(window.activeTextEditor);
      window.showInformationMessage("Import Cost cache cleared");
    })
  );

  if (window.activeTextEditor?.document && esbuildPath) {
    scan(window.activeTextEditor.document, esbuildPath);
  }
}
