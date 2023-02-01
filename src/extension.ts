import { locateESBuild } from "env:locate";
import type { ExtensionContext } from "vscode";
import { commands, window, workspace } from "vscode";

import { config } from "./configuration";
import { flush } from "./decoration";
import { log } from "./log";
import { scan } from "./scan";

export async function activate(ctx: ExtensionContext) {
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
