import { dirname } from "env:path";
import type { TextDocument } from "vscode";
import { Uri } from "vscode";

import { decorate } from "./decoration";
import { calculate, parseImports, resolve } from "./engine";
import type { Language } from "./engine/parser";
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

export async function scan(document: TextDocument, esbuildPath: string) {
  const { languageId, fileName, getText, uri } = document;
  if (isAllowedLanguage(languageId, fileName)) {
    const code = getText();

    const imports = parseImports({
      content: code,
      language: languageId as Language,
      fileName
    });

    const { imports: resolvedImports, externals } = await resolve({
      cwd: Uri.file(dirname(uri.fsPath)),
      imports
    });

    const result = await calculate(resolvedImports, {
      esbuildBinary: esbuildPath,
      externals,
      cwd: Uri.file(dirname(uri.fsPath))
    });

    if (!result) {
      log.info(`No imports found - ${fileName}`);
      return;
    }

    log.info(`CALCULATED IMPORTS - ${fileName}`, result);

    decorate(document, result);
  }
}
