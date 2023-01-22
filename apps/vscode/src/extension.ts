import { locateESBuild } from "esbuild-shim";
import type { ExtensionContext } from "vscode";
import { commands, window, workspace } from "vscode";

import { config } from "./configuration";
import { flush } from "./declaration";
import { log } from "./log";
import { scan } from "./scan";
import { openSetupPanel } from "./webviews/setup.webview";

export async function activate(ctx: ExtensionContext) {
  const esbuildPath = locateESBuild();
  log.info("located esbuild", esbuildPath);

  const enable = config.get("enable");
  const sizes = config.get("sizes");

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
    })
  );

  if (!esbuildPath) {
    // openSetupPanel(ctx);
    const action = await window.showErrorMessage(
      "ESBuild is not installed. Please install it to use this extension.",
      "Install ESBuild",
      "Skip"
    );

    if (action === "Install ESBuild") {
      // Install ESBuild globally with npm
    }
  }
}
