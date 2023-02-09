import type { TextDocument } from "vscode";

import { config } from "./configuration";
import { decorate } from "./decoration";
import { calculateCost } from "./engine";
import type { Language } from "./engine";
import { log } from "./logger";

function isAllowedLanguage(language: string, fileName: string): boolean {
  // TODO: Incorporate the extensions settings into this.
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

export async function scan(document: TextDocument, esbuildPath: string) {
  if (config.get("enable")) {
    const { languageId, fileName, getText, uri } = document;
    if (isAllowedLanguage(languageId, fileName)) {
      const code = getText();
      log.info(`Scanning - ${fileName}`);
      const result = await calculateCost({
        path: fileName,
        language: languageId as Language,
        externals: [],
        code,
        cwd: uri,
        esbuild: esbuildPath
      });

      if (!result) {
        log.info(`No imports found - ${fileName}`);
        return;
      }

      log.info(`RESULT - ${fileName}`, result?.imports.join(", "));
      // TODO: Add decorator to the line.
      decorate(document, result?.imports ?? []);
    }
  }
}
