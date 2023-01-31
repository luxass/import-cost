import { locateESBuild } from "env:locate";
import type { ExtensionContext } from "vscode";
import { commands, window, workspace } from "vscode";

import { config } from "./configuration";
import { flush } from "./decoration";
import { log } from "./log";
import { scan } from "./scan";

export async function activate(ctx: ExtensionContext) {
  const esbuildPath = await locateESBuild(
    workspace.workspaceFolders![0].uri
  );
  if (!esbuildPath) {
    log.error("Couldn't locate ESBuild");
    const action = await window.showErrorMessage(
      "ESBuild is not installed. Please install it to use this extension.\nYou can read more about why [here](https://luxass.dev/import-cost)",
      "Install ESBuild",
      "Skip"
    );

    if (action === "Install ESBuild") {
      log.info("Installing ESBuild");
    }
  }

  const enable = config.get("enable");
  log.info("Import Cost is turned", enable ? "on" : "off");

  ctx.subscriptions.push(
    workspace.onDidChangeTextDocument(async (event) => scan(event.document)),
    window.onDidChangeActiveTextEditor(async (event) => scan(event?.document)),
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

  scan(window.activeTextEditor?.document);
}
