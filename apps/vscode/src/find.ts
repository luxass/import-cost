import type { FindFn } from "import-cost-engine";
import { Uri, workspace } from "vscode";

import { parse, resolve } from "env:path";

export const find: FindFn = async (name, options) => {
  const { cwd } = options;

  let dir = resolve(Uri.file(cwd.pathname).fsPath);

  const root = parse(dir).root;
  const fileNames = Array.isArray(name) ? name : [name];

  while (dir !== root) {
    for (const name of fileNames) {
      const file = Uri.file(resolve(dir, name));
      try {
        await workspace.fs.stat(file);
        return file.fsPath;
      } catch (e) {
        if (e.code !== "FileNotFound") {
          throw e;
        }
      }
    }
    dir = parse(dir).dir;
  }
  return undefined;
};
