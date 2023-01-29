import { dirname } from "node:path";

import type { TextDocument } from "vscode";

import { calculateCost } from "@luxass/import-cost";
import type { Language } from "@luxass/import-cost";

import { config } from "./configuration";
import { log } from "./log";
import { isAllowedLanguage } from "./utils";

export async function scan(document: TextDocument | undefined) {
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
        log,
        cwd: dirname(uri.fsPath)
      });
      console.log(JSON.stringify(result, null, 2))
      log.info(`RESULT - ${fileName}`, result?.imports.join(", "));
    }
  }
}
