import { dirname } from "node:path";

import type { TextDocument } from "vscode";

import { config } from "./configuration";
import { calculateCost } from "./engine";
import type { Language } from "./engine";
import { log } from "./log";

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

export async function scan(
  document: TextDocument | undefined,
  esbuildPath: string
) {
  if (document && config.get("enable")) {
    const { languageId, fileName, getText, uri } = document;
    if (isAllowedLanguage(languageId, fileName)) {
      const code = getText();
      log.info(`Scanning - ${fileName}`);
      const result = await calculateCost({
        path: fileName,
        language: languageId as Language,
        externals: [],
        code,
        cwd: dirname(uri.fsPath),
        esbuild: esbuildPath
      });
      console.log(JSON.stringify(result, null, 2));
      log.info(`RESULT - ${fileName}`, result?.imports.join(", "));
    }
  }
}
