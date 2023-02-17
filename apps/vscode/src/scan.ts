import type { Language } from "import-cost-engine";
import { calculate, parseImports } from "import-cost-engine";
import type { TextDocument } from "vscode";
import { dirname } from "env:path";
import { config } from "./configuration";
import { find } from "./find";
import { log } from "./logger";
import { decorate } from "./decoration";

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

      const imports = parseImports({
        content: code,
        language: languageId as Language,
        fileName,
        // We should not do this here....
        formats: config.get("formats"),
        platforms: config.get("platforms"),
        skips: config.get("skip")
      });

      const result = await calculate({
        cwd: new URL(dirname(uri.fsPath), "file://"),
        imports,
        log,
        find,
        esbuildBinary: esbuildPath,
        externals: config.get("externals"),
        platform: config.get("platform"),
        format: config.get("format")
      });

      if (!result) {
        log.info(`No imports found - ${fileName}`);
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      log.info(`RESULT - ${fileName}`, result.packages.join(", "));

      decorate(document, result?.packages ?? []);
    }
  }
}
