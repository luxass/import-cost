import type { ExtensionContext } from "vscode";
import { commands, window, workspace } from "vscode";

import { config } from "./configuration";
import { flush } from "./declaration";
import { locateESBuild } from "./locate";
import { log } from "./log";
import { scan } from "./scan";
import { openSetupPanel } from "./webviews/setup.webview";

export async function activate(ctx: ExtensionContext) {
  const esbuildPath = locateESBuild();
  log.info("located esbuild", esbuildPath);

  const sizes = config.get("sizes");

  console.log("SIZES", sizes);

  if (!esbuildPath) {
    // openSetupPanel(ctx);
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
    commands.registerCommand("import-cost.setup", async () => {
      try {
        openSetupPanel(ctx);
      } catch (error) {
        console.error(error);
      }
    }),
    commands.registerCommand("import-cost.clear-cache", () => {
      window.showInformationMessage("Import Cost cache cleared");
    })
  );
}
