import { locateESBuild } from "esbuild-shim";
import type { ExtensionContext, TextDocument } from "vscode";
import { commands, window, workspace } from "vscode";

import type { Language } from "@luxass/import-cost";
import { calculateCost } from "@luxass/import-cost";

import { config } from "./configuration";
import { flush } from "./declaration";
import { openSetupPanel } from "./webviews/setup.webview";

export async function activate(ctx: ExtensionContext) {
  const esbuildPath = locateESBuild();
  console.log("located esbuild", esbuildPath);

  const enable = config.get("enable");
  const sizes = config.get("sizes");

  console.log("enable", enable);
  console.log("sizes", sizes);

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
    window.showErrorMessage(
      "ESBuild is not installed. Please install it to use this extension."
    );
  }
}

let scani = 0;

async function scan(document: TextDocument | undefined) {
  if (document && config.get("enable")) {
    scani++;
    console.log("ASJDKJLASJKLDASJLKD", scani);

    const { languageId, fileName, getText } = document;
    if (isAllowedLanguage(languageId, fileName)) {
      const code = getText();
      const result = await calculateCost({
        path: fileName,
        language: languageId as Language,
        external: [],
        code
      });
      console.log("workspace#onDidChangeTextDocument", result);
    }
  }
}

function isAllowedLanguage(language: string, fileName: string): boolean {
  return (
    language === "javascriptreact" ||
    fileName.endsWith(".jsx") ||
    language === "typescriptreact" ||
    fileName.endsWith(".tsx") ||
    language === "javascript" ||
    fileName.endsWith(".js") ||
    language === "typescript" ||
    fileName.endsWith(".ts") ||
    language === "svelte" ||
    fileName.endsWith(".svelte") ||
    language === "astro" ||
    fileName.endsWith(".astro") ||
    language === "vue" ||
    fileName.endsWith(".vue")
  );
}
