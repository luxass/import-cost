import { locateESBuild } from "env:locate";
import { getPackageManager } from "pm";
import type { ExtensionContext } from "vscode";
import {
  commands,
  ShellExecution,
  Task,
  tasks,
  TaskScope,
  window,
  workspace
} from "vscode";

import { config } from "./configuration";
import { flush } from "./decoration";
import { log } from "./log";
import { scan } from "./scan";

declare global {
  const IS_WEB: boolean;
}

export async function activate(ctx: ExtensionContext) {
  if (!IS_WEB) {
    ctx.subscriptions.push(
      commands.registerCommand("import-cost.install-esbuild", async () => {
        const pm = await getPackageManager(workspace.workspaceFolders![0].uri);
        const args = pm === "yarn" ? ["global", "add", "esbuild"] : ["install", "-g", "esbuild"];
        tasks.executeTask(
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
    workspace.onDidChangeTextDocument(async (event) =>
      scan(event.document, esbuildPath)
    ),
    window.onDidChangeActiveTextEditor(async (event) =>
      scan(event?.document, esbuildPath)
    ),
    commands.registerCommand("import-cost.toggle-declaration", () => {
      const enable = config.get("enable");
      config.set("enable", !enable);
      flush();
      window.showInformationMessage(`Import Cost is now turned ${enable}`);
    }),
    commands.registerCommand("import-cost.clear-cache", () => {
      window.showInformationMessage("Import Cost cache cleared");
      flush();
    })
  );

  scan(window.activeTextEditor?.document, esbuildPath);
}
