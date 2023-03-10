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

    log.info(`IMPORTS - ${fileName}`, imports);

    const { imports: resolvedImports, externals } = await resolve({
      cwd: Uri.file(dirname(uri.fsPath)),
      imports
    });

    log.info(`RESOLVED IMPORTS - ${fileName}`, resolvedImports);

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
    // const fn = debouncePromise(calculate, 1000);

    // const result = await fn({
    //   cwd: new URL(dirname(uri.fsPath), "file://"),
    //   imports,
    //   ctx: {
    //     log,
    //     find,
    //     esbuildBinary: esbuildPath,
    //     readFile: async (path) => {
    //       return new TextDecoder().decode(
    //         await workspace.fs.readFile(Uri.file(path))
    //       );
    //     }
    //   },
    //   externals: config.get("externals"),
    //   platform: config.get("platform"),
    //   format: config.get("format")
    // });

    // const result = await calculate({
    //   cwd: new URL(dirname(uri.fsPath), "file://"),
    //   imports,
    //   ctx: {
    //     log,
    //     find,
    //     esbuildBinary: esbuildPath,
    //     readFile: async (path) => {
    //       return new TextDecoder().decode(
    //         await workspace.fs.readFile(Uri.file(path))
    //       );
    //     }
    //   },
    //   externals: config.get("externals"),
    //   platform: config.get("platform"),
    //   format: config.get("format")
    // });

    // if (!result) {
    //   log.info(`No imports found - ${fileName}`);
    //   console.log(JSON.stringify(result, null, 2));
    //   return;
    // }

    // log.info(`RESULT - ${fileName}`, result.packages.join(", "));

    // decorate(document, result?.packages ?? []);
  }
}

export function debouncePromise<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  abortValue: any = undefined
) {
  let cancel = () => {};
  // type Awaited<T> = T extends PromiseLike<infer U> ? U : T
  type ReturnT = Awaited<ReturnType<T>>;
  const wrapFunc = (...args: Parameters<T>): Promise<ReturnT> => {
    cancel();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve(fn(...args)), wait);
      cancel = () => {
        clearTimeout(timer);
        if (abortValue !== undefined) {
          reject(abortValue);
        }
      };
    });
  };
  return wrapFunc;
}
