import type { Webview } from "vscode";
import {
  commands,
  Uri,
  ViewColumn,
  window,
  workspace,
  type ExtensionContext
} from "vscode";

import { getPackages } from "@luxass/import-cost";

import { locateESBuild } from "./esbuild";
import { openSetupPanel } from "./webviews/setup.webview";

export async function activate(ctx: ExtensionContext) {
  const esbuildPath = locateESBuild();
  console.log("located esbuild", esbuildPath);

  ctx.subscriptions.push(
    workspace.onDidChangeTextDocument(async (event) => {
      console.log("workspace#onDidChangeTextDocument", event);
      if (event.document.languageId === "javascript") {
        console.log("workspace#onDidChangeTextDocument#javascript", event);
        const content = new TextDecoder("utf8").decode(
          await workspace.fs.readFile(event.document.uri)
        );
        console.log(
          "workspace#onDidChangeTextDocument#javascript#content",
          content
        );
        getPackages(content);
      }
    }),
    window.onDidChangeActiveTextEditor((event) => {
      console.log("window#onDidChangeActiveTextEditor", event);
    }),
    commands.registerCommand("vscode-import-cost.toggle-declaration", () => {
      console.log("commands#vscode-import-cost.toggle-declaration");
    }),
    commands.registerCommand("vscode-import-cost.setup", async () => {
      try {
        openSetupPanel(ctx);
      } catch (error) {
        console.error(error);
      }
    })
  );

  if (!esbuildPath) {
    openSetupPanel(ctx);
    window.showErrorMessage(
      "ESBuild is not installed. Please install it to use this extension."
    );
  }
}
