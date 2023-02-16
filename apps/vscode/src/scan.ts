import { calculateCost } from "import-cost-engine";
import type { Language } from "import-cost-engine";
import type { TextDocument } from "vscode";

import { config } from "./configuration";
import { decorate } from "./decoration";
import { log } from "./logger";

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

export async function scan(document: TextDocument, esbuildPath: string) {
  // TODO: Remove this config.get
  if (config.get("enable")) {
    const { languageId, fileName, getText, uri } = document;
    if (isAllowedLanguage(languageId, fileName)) {
      const code = getText();
      log.info(`Scanning - ${fileName}`);
      const result = await calculateCost({
        path: fileName,
        language: languageId as Language,
        externals: config.get("externals"),
        code,
        cwd: new URL(uri.fsPath, "file://"),
        esbuild: esbuildPath,
        // We should not do this here....
        skips: config.get("skip"),
        format: config.get("defaultFormat"),
        platform: config.get("defaultPlatform"),
        formats: config.get("format"),
        platforms: config.get("platform")
      }).catch((err) => {
        log.error(`Error - ${fileName}`, err);
      })

      if (!result) {
        log.info(`No imports found - ${fileName}`);
        console.log(JSON.stringify(result, null, 2))
        return;
      }

      log.info(`RESULT - ${fileName}`, result?.packages.join(", "));
      // TODO: Remove the decorator/flush
      decorate(document, result?.packages ?? []);
    }
  }
}
