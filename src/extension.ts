// import { cache } from "import-cost-engine";
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
import { cache } from "./engine/cache";
import { locateESBuild } from "./locate";
import { log } from "./log";
import { scan } from "./scan";

declare global {
  const IS_WEB: boolean;
}

export async function activate(ctx: ExtensionContext) {
  const wixImportCost = extensions.getExtension("wix.vscode-import-cost");
  if (wixImportCost) {
    window.showWarningMessage(
      "You have both Wix Import Cost and Import Cost installed. Please uninstall Wix Import Cost to avoid conflicts."
    );
    // return;
  }

  if (!IS_WEB) {
    ctx.subscriptions.push(
      commands.registerCommand("import-cost.install-esbuild", async () => {
        await tasks.executeTask(
          new Task(
            {
              type: "npm"
            },
            TaskScope.Workspace,
            "Installing ESBuild",
            "npm",
            new ShellExecution("npm", ["install", "-g", "esbuild"])
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
      if (!event?.document || !esbuildPath || !config.get("enable")) return;
      scan(event.document, esbuildPath);
    }),
    window.onDidChangeActiveTextEditor(async (event) => {
      if (!event?.document || !esbuildPath || !config.get("enable")) return;
      scan(event.document, esbuildPath);
    })
  );
  ctx.subscriptions.push(
    commands.registerCommand("import-cost.toggle-import-cost", () => {
      window.showInformationMessage("Import Cost: toggle-declaration");
      const enableValue = config.get("enable");
      if (!enableValue) {
        console.log(window.activeTextEditor, esbuildPath);
        if (window.activeTextEditor?.document && esbuildPath) {
          scan(window.activeTextEditor.document, esbuildPath);
          console.log("scan");
        }
      } else {
        flush(window.activeTextEditor);
      }

      config.set("enable", !enableValue);
      window.showInformationMessage(
        `Import Cost is now turned ${!enableValue ? "on" : "off"}`
      );
    })
  );

  ctx.subscriptions.push(
    commands.registerCommand("import-cost.clear-import-cache", () => {
      log.info(`Cache is now cleared, contained ${cache.size} items`);
      cache.clear();

      flush(window.activeTextEditor);
      window.showInformationMessage("Import Cost cache cleared");
    })
  );

  if (
    window.activeTextEditor?.document &&
    esbuildPath &&
    config.get("enable")
  ) {
    scan(window.activeTextEditor.document, esbuildPath);
  }
}
