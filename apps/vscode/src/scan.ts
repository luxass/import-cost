import type { TextDocument } from "vscode";

import { calculateCost } from "@luxass/import-cost";
import type { Language } from "@luxass/import-cost";

import { config } from "./configuration";
import { isAllowedLanguage } from "./utils";

export async function scan(document: TextDocument | undefined) {
  if (document && config.get("enable")) {
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
