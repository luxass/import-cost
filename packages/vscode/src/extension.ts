import { locateESBuild } from "esbuild-shim";
import { commands, window, workspace } from "vscode";
import type { ExtensionContext } from "vscode";

import type { Language } from "@luxass/import-cost";
import { calculateCost, parsePackages } from "@luxass/import-cost";

import { openSetupPanel } from "./webviews/setup.webview";

export async function activate(ctx: ExtensionContext) {
  const esbuildPath = locateESBuild();
  console.log("located esbuild", esbuildPath);

  ctx.subscriptions.push(
    workspace.onDidChangeTextDocument(async (event) => {
      const { languageId, fileName } = event.document;
      if (isAllowedLanguage(languageId, fileName)) {
        const code = event.document.getText();
        const result = await calculateCost({
          path: fileName,
          language: languageId as Language,
          external: [],
          code
        });
        console.log("workspace#onDidChangeTextDocument", result);
      }
      // if (event.document.languageId === "javascript") {
      //   console.log("workspace#onDidChangeTextDocument#javascript", event);
      //   const content = new TextDecoder("utf8").decode(
      //     await workspace.fs.readFile(event.document.uri)
      //   );
      //   console.log(
      //     "workspace#onDidChangeTextDocument#javascript#content",
      //     content
      //   );
      //   getPackages(content);
      // }
    }),
    window.onDidChangeActiveTextEditor((event) => {
      console.log("window#onDidChangeActiveTextEditor", event);
    }),
    commands.registerCommand("import-cost.toggle-declaration", () => {
      console.log("commands#import-cost.toggle-declaration");
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
    openSetupPanel(ctx);
    window.showErrorMessage(
      "ESBuild is not installed. Please install it to use this extension."
    );
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
